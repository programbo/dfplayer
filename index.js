// NodeMCU serial pins
// const tx = D1
// const rx = D3
// const serial = Serial1
// NodeMCU Serial2 TX pin only ()
var tx = D2;
var rx = undefined;
var serial = Serial2;
// ESP32 serial pins
// const tx = D15
// const rx = D13
// const serial = Serial1
var START_BYTE = 0x7e;
var END_BYTE = 0xef;
var VERSION_BYTE = 0xff;
var DATA_LENGTH = 0x06;
var REQUEST_ACK = rx ? 0x01 : 0x00;
var Command;
(function (Command) {
    Command[Command["Next"] = 1] = "Next";
    Command[Command["Previous"] = 2] = "Previous";
    Command[Command["SetTrack"] = 3] = "SetTrack";
    Command[Command["IncreaseVolume"] = 4] = "IncreaseVolume";
    Command[Command["DecreaseVolume"] = 5] = "DecreaseVolume";
    Command[Command["SetVolume"] = 6] = "SetVolume";
    Command[Command["SetEQ"] = 7] = "SetEQ";
    Command[Command["SetMode"] = 8] = "SetMode";
    Command[Command["SetSource"] = 9] = "SetSource";
    Command[Command["Standby"] = 10] = "Standby";
    Command[Command["Resume"] = 11] = "Resume";
    Command[Command["Reset"] = 12] = "Reset";
    Command[Command["Play"] = 13] = "Play";
    Command[Command["Pause"] = 14] = "Pause";
    Command[Command["SetFolder"] = 15] = "SetFolder";
    Command[Command["SetGain"] = 16] = "SetGain";
    Command[Command["RepeatPlay"] = 17] = "RepeatPlay";
    Command[Command["QueryStatus"] = 66] = "QueryStatus";
    Command[Command["QueryVolume"] = 67] = "QueryVolume";
    Command[Command["QueryEQ"] = 68] = "QueryEQ";
    Command[Command["QueryMode"] = 69] = "QueryMode";
    Command[Command["QuerySoftwareVersion"] = 70] = "QuerySoftwareVersion";
    Command[Command["QueryTotalFilesOnTFCard"] = 71] = "QueryTotalFilesOnTFCard";
    Command[Command["QueryTotalFilesOnUDisk"] = 72] = "QueryTotalFilesOnUDisk";
    Command[Command["QueryTotalFilesOnFlash"] = 73] = "QueryTotalFilesOnFlash";
    Command[Command["QueryCurrentTrackOnTFCard"] = 75] = "QueryCurrentTrackOnTFCard";
    Command[Command["QueryCurrentTrackOnUDisk"] = 76] = "QueryCurrentTrackOnUDisk";
    Command[Command["QueryCurrentTrackOnFlash"] = 77] = "QueryCurrentTrackOnFlash";
})(Command || (Command = {}));
var EQ;
(function (EQ) {
    EQ[EQ["Normal"] = 0] = "Normal";
    EQ[EQ["Pop"] = 1] = "Pop";
    EQ[EQ["Rock"] = 2] = "Rock";
    EQ[EQ["Jazz"] = 3] = "Jazz";
    EQ[EQ["Classic"] = 4] = "Classic";
    EQ[EQ["Bass"] = 5] = "Bass";
})(EQ || (EQ = {}));
var Mode;
(function (Mode) {
    Mode[Mode["Repeat"] = 0] = "Repeat";
    Mode[Mode["FolderRepeat"] = 1] = "FolderRepeat";
    Mode[Mode["SingleRepeat"] = 2] = "SingleRepeat";
    Mode[Mode["Random"] = 3] = "Random";
})(Mode || (Mode = {}));
var Source;
(function (Source) {
    Source[Source["U"] = 0] = "U";
    Source[Source["TF"] = 1] = "TF";
    Source[Source["AUX"] = 2] = "AUX";
    Source[Source["Sleep"] = 3] = "Sleep";
    Source[Source["Flash"] = 4] = "Flash";
})(Source || (Source = {}));
var buffer = '';
serial.setup(9600, { tx: tx, rx: rx });
serial.on('data', function (data) {
    buffer += data;
    while (buffer.length >= 10) {
        var packet = buffer
            .slice(0, 10)
            .split('')
            .map(function (x) {
            return (256 + x.charCodeAt(0))
                .toString(16)
                .substr(-2)
                .toUpperCase();
        });
        buffer = buffer.slice(10);
        console.log("Returned: 0x" + parseByte(packet[3]));
        console.log("Parameter: 0x" + parseByte(packet[5]) + ", 0x" + parseByte(packet[6]));
    }
});
function parseByte(byte) {
    var value = parseInt(byte, 16);
    return byte + " (" + value + ")";
}
function getHighByte(checksum) {
    return checksum >> 8;
}
function getLowByte(checksum) {
    return checksum & 0xff;
}
function toBytes(value) {
    return [getHighByte(value), getLowByte(value)];
}
function calculateChecksum(command, p1, p2) {
    return -(VERSION_BYTE + DATA_LENGTH + command + REQUEST_ACK + p1 + p2);
}
function sendCommand(command, value) {
    if (value === void 0) { value = 0; }
    var _a = toBytes(value), p1 = _a[0], p2 = _a[1];
    var checksum = calculateChecksum(command, p1, p2);
    var payload = [
        START_BYTE,
        VERSION_BYTE,
        DATA_LENGTH,
        command,
        REQUEST_ACK,
        p1,
        p2,
        getHighByte(checksum),
        getLowByte(checksum),
        END_BYTE,
    ];
    serial.write(payload);
}
var mp3 = {
    playNext: function playNext() {
        sendCommand(Command.Next);
    },
    playPrevious: function playPrevious() {
        sendCommand(Command.Previous);
    },
    increaseVolume: function increaseVolume() {
        sendCommand(Command.IncreaseVolume);
    },
    decreaseVolume: function decreaseVolume() {
        sendCommand(Command.DecreaseVolume);
    },
    volume: function volume(volume) {
        if (typeof volume !== 'undefined') {
            sendCommand(Command.SetVolume, volume);
        }
        else {
            sendCommand(Command.QueryVolume);
        }
    },
    eq: function eq(genre) {
        if (typeof genre !== 'undefined') {
            sendCommand(Command.SetEQ, genre);
        }
        else {
            sendCommand(Command.QueryEQ);
        }
        sendCommand(Command.SetEQ, genre);
    },
    mode: function mode(mode) {
        if (typeof mode !== 'undefined') {
            sendCommand(Command.SetMode, mode);
        }
        else {
            sendCommand(Command.QueryMode);
        }
    },
    setSource: function setSource(source) {
        sendCommand(Command.SetSource, source);
    },
    standby: function standby() {
        sendCommand(Command.Standby);
    },
    resume: function resume() {
        sendCommand(Command.Resume);
    },
    reset: function reset() {
        sendCommand(Command.Reset);
    },
    play: function play(trackNumber) {
        if (typeof trackNumber !== 'undefined') {
            sendCommand(Command.SetTrack, trackNumber);
        }
        else {
            sendCommand(Command.Play);
        }
    },
    pause: function pause() {
        sendCommand(Command.Pause);
    },
    setPlaybackFolder: function setPlaybackFolder(folder) {
        var f = Math.max(1, Math.min(10, folder));
        sendCommand(Command.SetFolder, f);
    },
    setGain: function setGain(gain) {
        var g = Math.max(0, Math.min(31, gain));
        sendCommand(Command.SetGain, g);
    },
    setRepeat: function setRepeat(repeat) {
        if (repeat === void 0) { repeat = false; }
        sendCommand(Command.RepeatPlay, Number(repeat));
    },
    getStatus: function queryStatus() {
        sendCommand(Command.QueryStatus);
    },
    getSoftwareVersion: function querySoftwareVersion() {
        sendCommand(Command.QuerySoftwareVersion);
    },
    getTotalFilesOnTFCard: function queryTotalFilesOnTFCard() {
        sendCommand(Command.QueryTotalFilesOnTFCard);
    },
    getTotalFilesOnUDisk: function queryTotalFilesOnUDisk() {
        sendCommand(Command.QueryTotalFilesOnUDisk);
    },
    getTotalFilesOnFlash: function queryTotalFilesOnFlash() {
        sendCommand(Command.QueryTotalFilesOnFlash);
    },
    getCurrentTrackOnTFCard: function queryCurrentTrackOnTFCard() {
        sendCommand(Command.QueryCurrentTrackOnTFCard);
    },
    getCurrentTrackOnUDisk: function queryCurrentTrackOnUDisk() {
        sendCommand(Command.QueryCurrentTrackOnUDisk);
    },
    getCurrentTrackOnFlash: function queryCurrentTrackOnFlash() {
        sendCommand(Command.QueryCurrentTrackOnFlash);
    }
};
