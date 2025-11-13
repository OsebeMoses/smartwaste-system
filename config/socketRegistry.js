let ioInstance = null;

function setIo(io) {
	ioInstance = io;
}

function getIo() {
	return ioInstance;
}

function emitToUser(userId, event, data) {
	if (!ioInstance || !userId) return;
	ioInstance.to(`user_${userId}`).emit(event, data);
}

function emitToAdmins(event, data) {
	if (!ioInstance) return;
	ioInstance.to('admins').emit(event, data);
}

function emitToCollector(collectorId, event, data) {
	if (!ioInstance || !collectorId) return;
	ioInstance.to(`collector_${collectorId}`).emit(event, data);
}

module.exports = { setIo, getIo, emitToUser, emitToAdmins, emitToCollector };


