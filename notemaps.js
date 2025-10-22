const keys = {
    Cdorian: [C4, D, Eb, F, G, A, Bb, C5],
    Cphrygian: [C4, Db, Eb, F, G, Ab, Bb, C5],
    Clydian: [C4, D, E, Gb, G, A, B, C5]
}

//frequencies in hertz https://muted.io/note-frequencies
//Technically Lydian has F# and not Gb, but who cares lol I dont wan't to figure out how to define each notes sharp and the next one's flat in the same line. Also javascript doesn't like the sharp symbol
const frequencies = {
    C4: 261.63,
    Db: 277.18,
    D: 293.66,
    Eb: 311.13,
    E: 329.63,
    F: 349.23,
    Gb: 369.99,
    G: 392,
    Ab: 415.3,
    A: 440,
    Bb: 466.16,
    B: 493.88,
    C5: 523.25, 
}