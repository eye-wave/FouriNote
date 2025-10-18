extern crate alloc;

use alloc::vec::Vec;
use midly::num::{u4, u7, u15};
use midly::{Format, Header, MetaMessage, MidiMessage, Smf, Timing, TrackEvent, TrackEventKind};
use wasm_bindgen::prelude::*;

use crate::STATE;

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

    if scale == 0 || scale == 4095 {
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

#[wasm_bindgen(js_name = "emf")]
pub fn export_midi_file(bpm: u32) -> Vec<u8> {
    let notes = unsafe { STATE.notes };
    let gate = unsafe { STATE.gate };
    let tpq = 480;

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
