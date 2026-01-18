import os, io
import shutil
import tempfile
import subprocess
import tarfile
import urllib
import ctypes
import time

import decky_plugin

# Note: all plugin arguments are pointing to Plugin and not to an instance of it
class Plugin:
  async def _main(plugin):
    variant = os.environ.get('PLUGIN_VARIANT')
    plugin.discord = Discord.choose_variant(variant)
    plugin.backend = NodeBackend()

  async def install(plugin):
    decky_plugin.logger.debug('Attempting to install Discord')
    plugin.discord.install()

  async def start(plugin):
    decky_plugin.logger.debug('Attempting to install Discord client plugin')
    plugin.discord.install_plugin()

    decky_plugin.logger.debug('Attempting to start Discord')
    plugin.discord.start()
    
    # Start Node.js backend for discord.js client
    decky_plugin.logger.debug('Attempting to start Node.js backend')
    plugin.backend.start()

  async def status(plugin):
    installed = plugin.discord.is_installed()
    running = plugin.discord.is_running()
    backend_running = plugin.backend.is_running()

    decky_plugin.logger.debug(f'Querying Discord status: installed={installed}, running={running}, backend={backend_running}')

    return dict(running = running, installed = installed, backend_running = backend_running)

  async def stop(plugin):
    decky_plugin.logger.debug('Attempting to stop Discord')
    plugin.discord.stop()
    
    decky_plugin.logger.debug('Attempting to stop Node.js backend')
    plugin.backend.stop()

  async def _unload(plugin):
    decky_plugin.logger.debug('Unloading plugin, attempt to stop Discord and backend')
    plugin.discord.stop()
    plugin.backend.stop()

class NodeBackend:
  """Manages the Node.js backend process that runs discord.js"""
  
  def __init__(self):
    self.process = None
    self.backend_dir = os.path.join(decky_plugin.DECKY_PLUGIN_DIR, 'backend-node')
    self.log_file = None

  def is_running(self):
    if self.process is None:
      return False
    
    returncode = self.process.poll()
    return returncode is None

  def start(self):
    if self.is_running():
      decky_plugin.logger.info('Node.js backend already running')
      return
    
    # Check if Node.js is available
    try:
      subprocess.run(['node', '--version'], capture_output=True, check=True)
    except:
      decky_plugin.logger.error('Node.js not found. Cannot start backend.')
      return
    
    # Install dependencies if needed
    node_modules = os.path.join(self.backend_dir, 'node_modules')
    if not os.path.exists(node_modules):
      decky_plugin.logger.info('Installing Node.js backend dependencies...')
      try:
        subprocess.run(['npm', 'install'], cwd=self.backend_dir, check=True, timeout=120)
      except Exception as e:
        decky_plugin.logger.error(f'Failed to install backend dependencies: {e}')
        return
    
    # Start the backend server
    try:
      server_script = os.path.join(self.backend_dir, 'src', 'server.js')
      
      # Open log file
      log_path = os.path.join(decky_plugin.DECKY_PLUGIN_LOG_DIR, 'discord-backend.log')
      self.log_file = open(log_path, 'w')
      
      env = os.environ.copy()
      env['PORT'] = '52260'
      
      self.process = subprocess.Popen(
        ['node', server_script],
        cwd=self.backend_dir,
        env=env,
        stdout=self.log_file,
        stderr=subprocess.STDOUT,
      )
      
      # Wait a bit for server to start
      time.sleep(2)
      
      if self.is_running():
        decky_plugin.logger.info(f'Node.js backend started with PID {self.process.pid}')
      else:
        decky_plugin.logger.error('Node.js backend failed to start')
        
    except Exception as e:
      decky_plugin.logger.error(f'Failed to start Node.js backend: {e}')

  def stop(self):
    if not self.is_running():
      return
    
    try:
      self.process.terminate()
      self.process.wait(timeout=5)
      decky_plugin.logger.info('Node.js backend stopped')
    except subprocess.TimeoutExpired:
      self.process.kill()
      self.process.wait()
      decky_plugin.logger.warning('Node.js backend killed (did not terminate gracefully)')
    except Exception as e:
      decky_plugin.logger.error(f'Error stopping Node.js backend: {e}')
    finally:
      self.process = None
      if self.log_file:
        self.log_file.close()
        self.log_file = None

class Discord:
  @staticmethod
  def choose_variant(variant):
    variants = dict({
      'develop': Discord,
      'flatpak': FlatpakDiscord,
      'native': NativeDiscord,
    })

    discord = variants.get(variant, FlatpakDiscord)

    return discord()

  def configdir():
    pass

  def is_running(self):
    return True

  def start(self):
    pass

  def stop(self):
    pass

  def is_installed(self):
    return True

  def install(self):
    return False

  def install_plugin(self):
    if not self.is_installed() or self.is_running():
      return False

    source = decky_plugin.DECKY_PLUGIN_DIR + '/bin/discord-qs4sd.so'
    target = self.configdir() + '/plugins/discord-qs4sd.so'

    if os.path.exists(target):
      os.chmod(target, 0o755)

    try:
      shutil.copy(source, target)
      return True
    except:
      return False

  def add_bookmark(self, dbpath, nickname, bookmark_name, address, port):
    library = decky_plugin.DECKY_PLUGIN_DIR + '/bin/discord-qs4sd.so'
    handle = ctypes.cdll.LoadLibrary(library)

    add = handle.DiscordBookmarkManager_addBookmark
    add.restype = ctypes.c_bool
    add.argtypes = [ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p, ctypes.c_char_p, ctypes.c_uint]

    return add(dbpath, nickname, bookmark_name, address, port)

class NativeDiscord(Discord):
  def __init__(self):
    self.process = None
    self.version = '0.0.71'
    self.installdir = '/opt/discord'
    self.executable = 'Discord'
    self.environ = dict(os.environ) | {
      'DISPLAY': ':0',
      'PULSE_SERVER': f'unix:/run/user/{os.getuid()}/pulse/native',
      'PULSE_CLIENTCONFIG': f'/run/user/{os.getuid()}/pulse/config',
      'QT_PLUGIN_PATH': '.',
      'LD_LIBRARY_PATH': '.',
    }

  def configdir(self):
    homedir = decky_plugin.DECKY_USER_HOME
    return f'{homedir}/.config/discord'

  def is_running(self):
    if self.process is None:
      return False

    returncode = self.process.poll()
    running = returncode is None

    return running

  def start(self):
    if self.is_running():
      return

    args = []
    executable = f'{self.installdir}/{self.executable}'

    try:
      self.process = subprocess.Popen(args, executable=executable, env=self.environ, cwd=self.installdir)
      self.process.poll()
    except:
      pass

  def stop(self):
    if not self.is_running():
      return

    try:
      self.process.kill()
      self.process.wait(timeout=5)
    except:
      pass

  def is_installed(self):
    executable = f'{self.installdir}/{self.executable}'
    installed = os.path.exists(executable) is True
    return installed

  def install(self):
    if self.is_installed():
      return True

    if self.is_running():
      return False

    url = f'https://discord.com/api/download?platform=linux&format=tar.gz'

    try:
      wget = urllib.request.urlopen(url)

      file = tempfile.TemporaryFile()
      shutil.copyfileobj(wget, file)

      os.makedirs(self.installdir, mode=0o700, exist_ok=True)
      file.seek(0)

      tar = tarfile.open(fileobj=file, mode='r:gz')
      tar.extractall(path=self.installdir)

      file.close()
      return True
    except:
      return False

class FlatpakDiscord(Discord):
  def __init__(self):
    self.environ = dict(os.environ) | {
      'DISPLAY': ':0',
      'PULSE_SERVER': f'unix:/run/user/{os.getuid()}/pulse/native',
      'PULSE_CLIENTCONFIG': f'/run/user/{os.getuid()}/pulse/config',
    }
    # Decky Loader uses a utility called `pyinstaller` to bundle their application into
    # a single executable. When such an application is started a temporary directory is
    # chosen where all required runtime dependencies are extracted. Then LD_LIBRARY_PATH
    # is set to point to this directory. Those runtime dependencies might not be compatible
    # with other programs installed on the system (for example flatpak).
    #
    # Unsetting LD_LIBRARY_PATH ensures that flatpak is using the system libraries again.
    self.environ.pop('LD_LIBRARY_PATH')

  def configdir(self):
    homedir = decky_plugin.DECKY_USER_HOME
    appsdir = '.var/app/com.discordapp.Discord'
    return f'{homedir}/{appsdir}/config/discord'

  def is_running(self):
    try:
      ps = subprocess.check_output(['flatpak', 'ps'], encoding='utf-8', env=self.environ)
      return 'com.discordapp.Discord' in ps
    except:
      return False

  def start(self):
    if self.is_running():
      return

    try:
      subprocess.Popen(['flatpak', 'run', 'com.discordapp.Discord'], env=self.environ)
    except:
      pass

  def stop(self):
    if not self.is_running():
      return

    try:
      subprocess.run(['flatpak', 'kill', 'com.discordapp.Discord'], env=self.environ)
    except:
      pass

  def is_installed(self):
    try:
      ls = subprocess.check_output(['flatpak', 'list'], encoding='utf-8', env=self.environ)
      return 'com.discordapp.Discord' in ls
    except:
      return False

  def install(self):
    if self.is_installed():
      return True

    if self.is_running():
      return False

    try:
      subprocess.run(['flatpak', 'install', 'com.discordapp.Discord', '--noninteractive'], env=self.environ)
      return True
    except:
      return False
