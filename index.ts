// NodeMCU serial pins
// const tx = D1
// const rx = D3
// const serial = Serial1

// NodeMCU Serial2 TX pin only ()
const tx = D2
const rx = undefined
const serial = Serial2

// ESP32 serial pins
// const tx = D15
// const rx = D13
// const serial = Serial1

const START_BYTE = 0x7e
const END_BYTE = 0xef
const VERSION_BYTE = 0xff
const DATA_LENGTH = 0x06
const REQUEST_ACK = rx ? 0x01 : 0x00

enum Command {
  Next = 1,
  Previous,
  SetTrack,
  IncreaseVolume,
  DecreaseVolume,
  SetVolume,
  SetEQ,
  SetMode,
  SetSource,
  Standby,
  Resume,
  Reset,
  Play,
  Pause,
  SetFolder,
  SetGain,
  RepeatPlay,
  QueryStatus = 66,
  QueryVolume,
  QueryEQ,
  QueryMode,
  QuerySoftwareVersion,
  QueryTotalFilesOnTFCard,
  QueryTotalFilesOnUDisk,
  QueryTotalFilesOnFlash,
  QueryCurrentTrackOnTFCard = 75,
  QueryCurrentTrackOnUDisk,
  QueryCurrentTrackOnFlash,
}

enum EQ {
  Normal,
  Pop,
  Rock,
  Jazz,
  Classic,
  Bass,
}

enum Mode {
  Repeat,
  FolderRepeat,
  SingleRepeat,
  Random,
}

enum Source {
  U,
  TF,
  AUX,
  Sleep,
  Flash,
}

let buffer: string = ''
serial.setup(9600, { tx, rx })
serial.on('data', function(data) {
  buffer += data

  while (buffer.length >= 10) {
    const packet: any[] = buffer
      .slice(0, 10)
      .split('')
      .map(x =>
        (256 + x.charCodeAt(0))
          .toString(16)
          .substr(-2)
          .toUpperCase()
      )
    buffer = buffer.slice(10)
    console.log(`Returned: 0x${parseByte(packet[3])}`)
    console.log(
      `Parameter: 0x${parseByte(packet[5])}, 0x${parseByte(packet[6])}`
    )
  }
})

function parseByte(byte: string) {
  const value = parseInt(byte, 16)
  return `${byte} (${value})`
}

function getHighByte(checksum: number) {
  return checksum >> 8
}

function getLowByte(checksum: number) {
  return checksum & 0xff
}

function toBytes(value: number) {
  return [getHighByte(value), getLowByte(value)]
}

function calculateChecksum(command: Command, p1: number, p2: number) {
  return -(VERSION_BYTE + DATA_LENGTH + command + REQUEST_ACK + p1 + p2)
}

function sendCommand(command: Command, value: number = 0) {
  const [p1, p2] = toBytes(value)
  const checksum = calculateChecksum(command, p1, p2)
  const payload = [
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
  ]
  serial.write(payload)
}

const mp3 = {
  playNext: function playNext() {
    sendCommand(Command.Next)
  },
  playPrevious: function playPrevious() {
    sendCommand(Command.Previous)
  },
  increaseVolume: function increaseVolume() {
    sendCommand(Command.IncreaseVolume)
  },
  decreaseVolume: function decreaseVolume() {
    sendCommand(Command.DecreaseVolume)
  },
  volume: function volume(volume: number) {
    if (typeof volume !== 'undefined') {
      sendCommand(Command.SetVolume, volume)
    } else {
      sendCommand(Command.QueryVolume)
    }
  },
  eq: function eq(genre?: EQ) {
    if (typeof genre !== 'undefined') {
      sendCommand(Command.SetEQ, genre)
    } else {
      sendCommand(Command.QueryEQ)
    }
    sendCommand(Command.SetEQ, genre)
  },
  mode: function mode(mode?: Mode) {
    if (typeof mode !== 'undefined') {
      sendCommand(Command.SetMode, mode)
    } else {
      sendCommand(Command.QueryMode)
    }
  },
  setSource: function setSource(source: Source) {
    sendCommand(Command.SetSource, source)
  },
  standby: function standby() {
    sendCommand(Command.Standby)
  },
  resume: function resume() {
    sendCommand(Command.Resume)
  },
  reset: function reset() {
    sendCommand(Command.Reset)
  },
  play: function play(trackNumber?: number) {
    if (typeof trackNumber !== 'undefined') {
      sendCommand(Command.SetTrack, trackNumber)
    } else {
      sendCommand(Command.Play)
    }
  },
  pause: function pause() {
    sendCommand(Command.Pause)
  },
  setPlaybackFolder: function setPlaybackFolder(folder: number) {
    const f = Math.max(1, Math.min(10, folder))
    sendCommand(Command.SetFolder, f)
  },
  setGain: function setGain(gain: number) {
    const g = Math.max(0, Math.min(31, gain))
    sendCommand(Command.SetGain, g)
  },
  setRepeat: function setRepeat(repeat: boolean = false) {
    sendCommand(Command.RepeatPlay, Number(repeat))
  },
  getStatus: function queryStatus() {
    sendCommand(Command.QueryStatus)
  },
  getSoftwareVersion: function querySoftwareVersion() {
    sendCommand(Command.QuerySoftwareVersion)
  },
  getTotalFilesOnTFCard: function queryTotalFilesOnTFCard() {
    sendCommand(Command.QueryTotalFilesOnTFCard)
  },
  getTotalFilesOnUDisk: function queryTotalFilesOnUDisk() {
    sendCommand(Command.QueryTotalFilesOnUDisk)
  },
  getTotalFilesOnFlash: function queryTotalFilesOnFlash() {
    sendCommand(Command.QueryTotalFilesOnFlash)
  },
  getCurrentTrackOnTFCard: function queryCurrentTrackOnTFCard() {
    sendCommand(Command.QueryCurrentTrackOnTFCard)
  },
  getCurrentTrackOnUDisk: function queryCurrentTrackOnUDisk() {
    sendCommand(Command.QueryCurrentTrackOnUDisk)
  },
  getCurrentTrackOnFlash: function queryCurrentTrackOnFlash() {
    sendCommand(Command.QueryCurrentTrackOnFlash)
  },
}
