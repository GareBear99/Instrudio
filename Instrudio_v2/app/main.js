const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const midiBackend = require('./midi-backend');

let win = null;
let currentInstrument = 'violin';

const INSTRUMENTS = [
  { id: 'violin',  label: 'Studio Violin',   file: 'violin.html' },
  { id: 'piano',   label: 'Studio Grand',    file: 'piano.html' },
  { id: 'harp',    label: 'Celestial Harp',  file: 'harp.html' },
  { id: 'bongo',   label: 'Studio Bongos',   file: 'bongo.html' },
  { id: 'guitar',  label: 'Studio Guitar',   file: 'guitar.html' },
  { id: 'saxophone', label: 'Saxophone',     file: 'saxophone.html' },
  { id: 'accordion', label: 'Accordion',     file: 'accordion.html' },
  { id: 'harmonica', label: 'Harmonica',     file: 'harmonica.html' },
  { id: 'bagpipes',  label: 'Bagpipes',      file: 'bagpipes.html' },
  { id: 'triangle',  label: 'Triangle',      file: 'triangle.html' },
];

function loadInstrument(id) {
  const inst = INSTRUMENTS.find(i => i.id === id) || INSTRUMENTS[0];
  currentInstrument = inst.id;
  const filePath = path.join(__dirname, '..', inst.file);
  win.loadFile(filePath);
  win.setTitle('Instrudio — ' + inst.label);
  midiBackend.setInstrumentName(inst.label);
}

function buildMenu() {
  const instrumentMenu = INSTRUMENTS.map(inst => ({
    label: inst.label,
    type: 'radio',
    checked: inst.id === currentInstrument,
    click: () => loadInstrument(inst.id),
  }));

  const template = [
    {
      label: 'Instrudio',
      submenu: [
        { label: 'About Instrudio', role: 'about' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
      ],
    },
    {
      label: 'Instrument',
      submenu: instrumentMenu,
    },
    {
      label: 'MIDI',
      submenu: [
        {
          label: 'Refresh MIDI Ports',
          click: () => {
            const ports = midiBackend.refreshPorts();
            win.webContents.send('midi-ports-updated', ports);
          },
        },
        { type: 'separator' },
        {
          label: 'Virtual Output Port Active',
          type: 'checkbox',
          checked: true,
          click: (item) => {
            if (item.checked) midiBackend.enableVirtualOutput();
            else midiBackend.disableVirtualOutput();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Instrudio',
    backgroundColor: '#120b04',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  buildMenu();
  loadInstrument(currentInstrument);

  // Initialize native MIDI backend
  midiBackend.init((event, data) => {
    // Forward MIDI messages from native ports to the renderer
    if (win && !win.isDestroyed()) {
      win.webContents.send('native-midi-message', event, data);
    }
  });
}

// ── IPC Handlers ──────────────────────────────────────────────
// Renderer sends note-on/off → native MIDI output
ipcMain.on('midi-note-on', (_, note, velocity, channel) => {
  midiBackend.sendNoteOn(note, velocity, channel);
});

ipcMain.on('midi-note-off', (_, note, channel) => {
  midiBackend.sendNoteOff(note, channel);
});

ipcMain.on('midi-cc', (_, cc, value, channel) => {
  midiBackend.sendCC(cc, value, channel);
});

ipcMain.handle('midi-get-ports', () => {
  return midiBackend.getPorts();
});

ipcMain.on('midi-select-input', (_, portIndex) => {
  midiBackend.selectInput(portIndex);
});

// ── App lifecycle ─────────────────────────────────────────────
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  midiBackend.cleanup();
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
