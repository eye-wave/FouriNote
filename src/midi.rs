extern crate alloc;

use alloc::vec::Vec;
use midly::num::{u4, u7, u15};
use midly::{Format, Header, MetaMessage, MidiMessage, Smf, Timing, TrackEvent, TrackEventKind};
use wasm_bindgen::prelude::*;

use crate::{BUFFER_SIZE, STATE};

#[inline]
fn is_chromatic(scale: u16) -> bool {
    scale == 0 || scale == 4095
}

#[wasm_bindgen(js_name = "gsn")]
pub fn get_sample_norm() -> f32 {
    let norm = unsafe { &STATE.samples }
        .iter()
        .map(|s| s.abs())
        .fold(1.0_f32, f32::max);

    if norm > 1.0 { norm } else { 1.0 }
}

#[wasm_bindgen(js_name = "cnr")]
pub fn count_notes_in_range(min_note: u8, max_note: u8, scale: u16) -> u8 {
    let mut count = 0;

    if is_chromatic(scale) {
        return max_note - min_note;
    }

    for note in min_note..=max_note {
        let pitch_class = note % 12;
        if (scale & (1 << pitch_class)) != 0 {
            count += 1;
        }
    }

    count
}

#[wasm_bindgen(js_name = "dsn")]
pub fn downsample_notes(min_note: u8, max_note: u8, scale: u16) {
    let norm = get_sample_norm();
    let note_range = count_notes_in_range(min_note, max_note, scale) as f32;

    for (i, sample) in unsafe { &STATE.samples }.iter().enumerate() {
        let normalized = 1.0 - (sample / norm / 2.0 + 0.5);
        let note = (normalized * note_range).floor() as u8;

        unsafe { STATE.notes[i] = note }
    }
}

#[wasm_bindgen(js_name = "nns")]
pub fn get_nth_note_in_scale(n: u8, min_note: u8, max_note: u8, scale: u16) -> u8 {
    if is_chromatic(scale) {
        return (min_note + n).min(max_note);
    }

    if n == 0 {
        return min_note;
    }

    let mut count = 0;

    for note in min_note..=max_note {
        if is_note_in_scale(note, scale) {
            if n == count {
                return note;
            }

            count += 1;
        }
    }

    max_note
}

#[wasm_bindgen(js_name = "ins")]
pub fn is_note_in_scale(note: u8, scale: u16) -> bool {
    if is_chromatic(scale) {
        return true;
    }

    let note_class = note % 12;
    (scale & (1 << note_class)) != 0
}

fn downsampled_to_midi(min_note: u8, max_note: u8, scale: u16) -> [u8; BUFFER_SIZE] {
    let mut midi_notes = [0; BUFFER_SIZE];

    let allowed_notes: Vec<u8> = (min_note..=max_note)
        .filter(|&note| is_note_in_scale(note, scale))
        .collect();

    if allowed_notes.is_empty() {
        return midi_notes;
    }

    for (i, note) in unsafe { &STATE.notes }.iter().enumerate() {
        let note = *note as usize;
        let idx = if note >= allowed_notes.len() {
            allowed_notes.len() - 1
        } else {
            note
        };

        midi_notes[i] = allowed_notes[idx];
    }

    midi_notes
}

#[wasm_bindgen(js_name = "emf")]
pub fn export_midi_file(min_note: u8, max_note: u8, scale: u16, bpm: u32) -> Vec<u8> {
    let gate = unsafe { STATE.gate };
    let tpq = 480;

    let notes = downsampled_to_midi(min_note, max_note, scale);
    let tracks = (0..1).map(|_| Vec::new()).collect();

    let mut smf = Smf {
        header: Header {
            format: Format::SingleTrack,
            timing: Timing::Metrical(u15::from(tpq)),
        },
        tracks,
    };

    let track = smf.tracks.get_mut(0).unwrap();

    let us_per_qn = 60_000_000 / bpm;
    track.push(TrackEvent {
        delta: 0.into(),
        kind: TrackEventKind::Meta(MetaMessage::Tempo(us_per_qn.into())),
    });

    let mut i = 0;
    while i < notes.len() {
        if gate[i] == 1 {
            let note = notes[i];

            let mut duration = tpq;
            let mut j = i + 1;
            while j < notes.len() && notes[j] == note && gate[j] == 1 {
                duration += tpq;
                j += 1;
            }

            track.push(TrackEvent {
                delta: 0.into(),
                kind: TrackEventKind::Midi {
                    channel: u4::from(0),
                    message: MidiMessage::NoteOn {
                        key: u7::from(note),
                        vel: u7::from(100),
                    },
                },
            });

            track.push(TrackEvent {
                delta: (duration as u32).into(),
                kind: TrackEventKind::Midi {
                    channel: u4::from(0),
                    message: MidiMessage::NoteOff {
                        key: u7::from(note),
                        vel: u7::from(64),
                    },
                },
            });

            i = j;
        } else {
            i += 1;
        }
    }

    track.push(TrackEvent {
        delta: 0.into(),
        kind: TrackEventKind::Meta(MetaMessage::EndOfTrack),
    });

    let mut buf = Vec::new();
    smf.write(&mut buf).unwrap();
    buf
}
