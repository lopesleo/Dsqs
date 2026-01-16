import os, io
import shutil
import tempfile
import subprocess
import tarfile
import urllib

import decky_plugin

# Note: all plugin arguments are pointing to Plugin and not to an instance of it
class Plugin:
  async def _main(plugin):
    variant = os.environ.get('PLUGIN_VARIANT')
    plugin.discord = Discord.choose_variant(variant)

  async def install(plugin):
    decky_plugin.logger.debug('Attempting to install Discord backend')
    plugin.discord.install()

  async def start(plugin):
    decky_plugin.logger.debug('Attempting to start Discord backend')
    plugin.discord.start()

  async def status(plugin):
    installed = plugin.discord.is_installed()
    running = plugin.discord.is_running()

    decky_plugin.logger.debug(f'Querying Discord status: installed={installed}, running={running}')

    return dict(running = running, installed = installed)

  async def stop(plugin):
    decky_plugin.logger.debug('Attempting to stop Discord backend')
    plugin.discord.stop()

  async def _unload(plugin):
    decky_plugin.logger.debug('Unloading plugin, attempt to stop Discord backend')
    plugin.discord.stop()

class Discord:
  @staticmethod
  def choose_variant(variant):
    variants = dict({
      'develop': Discord,
      'node': NodeDiscord,
      'native': NativeDiscord,
    })

    discord = variants.get(variant, NodeDiscord)

    return discord()

  def configdir(self):
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

class NodeDiscord(Discord):
  def __init__(self):
    self.process = None
    self.environ = dict(os.environ) | {
      'NODE_ENV': 'production',
    }
    # Decky Loader uses a utility called `pyinstaller` to bundle their application into
    # a single executable. When such an application is started a temporary directory is
    # chosen where all required runtime dependencies are extracted. Then LD_LIBRARY_PATH
    # is set to point to this directory. Those runtime dependencies might not be compatible
    # with other programs installed on the system.
    #
    # Unsetting LD_LIBRARY_PATH ensures that node is using the system libraries again.
    self.environ.pop('LD_LIBRARY_PATH', None)

  def backenddir(self):
    return decky_plugin.DECKY_PLUGIN_DIR + '/backend-node'

  def is_running(self):
    if self.process is None:
      return False

    returncode = self.process.poll()
    running = returncode is None

    return running

  def start(self):
    if self.is_running():
      return

    backend_dir = self.backenddir()
    executable = shutil.which('node')
    
    if not executable:
      decky_plugin.logger.error('Node.js is not installed')
      return

    args = ['node', 'src/index.js']

    try:
      self.process = subprocess.Popen(args, executable=executable, env=self.environ, cwd=backend_dir)
      self.process.poll()
    except Exception as e:
      decky_plugin.logger.error(f'Failed to start Node.js backend: {e}')

  def stop(self):
    if not self.is_running():
      return

    try:
      self.process.terminate()
      self.process.wait(timeout=5)
    except Exception as e:
      decky_plugin.logger.error(f'Failed to stop Node.js backend: {e}')
      try:
        self.process.kill()
        self.process.wait(timeout=2)
      except:
        pass

  def is_installed(self):
    backend_dir = self.backenddir()
    package_json = f'{backend_dir}/package.json'
    node_modules = f'{backend_dir}/node_modules'
    installed = os.path.exists(package_json) and os.path.exists(node_modules)
    return installed

  def install(self):
    if self.is_installed():
      return True

    if self.is_running():
      return False

    backend_dir = self.backenddir()
    npm = shutil.which('npm')
    
    if not npm:
      decky_plugin.logger.error('npm is not installed')
      return False

    try:
      subprocess.run(['npm', 'install'], cwd=backend_dir, env=self.environ, check=True)
      return True
    except Exception as e:
      decky_plugin.logger.error(f'Failed to install Node.js dependencies: {e}')
      return False

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

    url = 'https://discord.com/api/download?platform=linux&format=tar.gz'

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
