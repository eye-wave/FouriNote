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

#[wasm_bindgen(js_name = "stn")]
pub fn samples_to_notes(min_note: u8, max_note: u8) {
    let norm = get_sample_norm();
    let note_range = (max_note - min_note) as f32;

    for (i, sample) in unsafe { &STATE.samples }.iter().enumerate() {
        let normalized = 1.0 - (sample / norm / 2.0 + 0.5);
        let note = (normalized * note_range).floor() as u8;

        unsafe { STATE.notes[i] = min_note + note }
    }
}

#[wasm_bindgen(js_name = "emf")]
pub fn export_midi_file(bpm: u32) -> Vec<u8> {
    let notes = unsafe { STATE.notes.clone() };
    let gate = unsafe { STATE.gate.clone() };
    let tpq = 480;

    let mut tracks = Vec::new();
    tracks.push(Vec::new());

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
