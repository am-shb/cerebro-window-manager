const { shellCommand, memoize } = require('cerebro-tools');
const pluginIcon = require('./icon.png');
const DEFAULT_ICON = require('./window.png');

const MEMOIZE_OPTIONS = {
  promise: 'then',
  maxAge: 5 * 1000,
  preFetch: true
}

/**
 * Parse each line of wmctrl command
 * @param {String} line of wmctrl result
 * @return {Array} array of windowId, windowTitle
 */
function parseWmctrlResult(str) {
  let arr = str.split(/\s+/)
  return [arr[0], arr[1], arr.slice(3).join(' ')]
}

function getFilteredWindowsRegex() {
  words = [
    'cerebro',
    'budgie-panel',
  ]
  return new RegExp(`[^\/]*${words.map(item => `(${item})`).join('|')}[^\/]*$`, 'i');
}

function getIcon(windowId) {
  // TODO: fetch the correct icon
  return DEFAULT_ICON;
}

const findWindow = memoize((searchWindowName) => {
  const regexp = new RegExp(`[^\/]*${searchWindowName}[^\/]*$`, 'i');
  return shellCommand('wmctrl -l').then(result => (
    result
      .split('\n')
      .slice(0,-1)
      .filter(line => (line.match(regexp) && !line.match(getFilteredWindowsRegex())))
      .map(str => {
        const [id, workspace, name] = parseWmctrlResult(str);
        const icon = getIcon(id);
        const title = name;
        return {
          id,
          title,
          subtitle: 'Workspace #' + (workspace+1),
          icon,
          onSelect: () => shellCommand(`wmctrl -ia ${id}`),
          onKeyDown: (event) => {
            if ((event.metaKey || event.ctrlKey) && event.keyCode === 68) {
              shellCommand(`wmctrl -ic ${id}`)
              event.preventDefault();
            }
          }
        };
      })
    )
  )
}, MEMOIZE_OPTIONS);

/**
 * Plugin to list open windows and raise or close them
 *
 * @param  {String} options.term
 * @param  {Function} options.display
 */
const fn = ({term, display}) => {
  const match = term.match(/^win\s(.*)/);
  var input = term
  if (match) {
    input = match[1]
  } 
  
  findWindow(input).then(list => {
    const results = list;
    display(results);
  });

};

module.exports = {
  name: 'Window manager',
  keyword: 'win',
  icon: pluginIcon,
  fn
};