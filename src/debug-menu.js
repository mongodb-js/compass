// slightly modified from https://github.com/parro-it/debug-menu since
// we require modules differently => doesn't work out of the box for us

var remote = window.require('remote');
var BrowserWindow = remote.require('browser-window');
var Menu = remote.require('menu');
var MenuItem = remote.require('menu-item');

var rightClickPos;

var menu = new Menu();
menu.append(new MenuItem({
  label: 'Inspect Element',
  click: function() {
    BrowserWindow.getFocusedWindow().inspectElement(rightClickPos.x, rightClickPos.y);
  }
}));

function onContextMenu(e) {
  e.preventDefault();
  rightClickPos = {x: e.x, y: e.y};
  menu.popup();
}

module.exports.install = function() {
  window.addEventListener('contextmenu', onContextMenu);
};
