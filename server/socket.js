let io = null;

function setIO(nextIO) {
  io = nextIO;
}

function getIO() {
  return io;
}

function emitLibraryEvent(libraryId, event, payload) {
  if (!io || !libraryId) {
    return;
  }

  io.to(`library:${libraryId}`).emit(event, payload);
}

module.exports = {
  emitLibraryEvent,
  getIO,
  setIO,
};
