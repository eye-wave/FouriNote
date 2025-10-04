#![allow(static_mut_refs)]
#![no_std]

use microfft::Complex32;
use wasm_bindgen::prelude::*;

const BUFFER_SIZE: usize = 64;

mod midi;

#[cfg(debug_assertions)]
#[wasm_bindgen(start)]
pub fn start() {
    console_error_panic_hook::set_once();
}

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub struct GlobalState {
    notes: [u8; BUFFER_SIZE],
    samples: [f32; BUFFER_SIZE],
    amps: [f32; BUFFER_SIZE],
    phases: [f32; BUFFER_SIZE],
    gate: [u8; BUFFER_SIZE],
}

impl GlobalState {
    const fn new() -> Self {
        Self {
            notes: [0; BUFFER_SIZE],
            samples: [0.0; BUFFER_SIZE],
            amps: [0.0; BUFFER_SIZE],
            phases: [0.0; BUFFER_SIZE],
            gate: [1; BUFFER_SIZE],
        }
    }
}

pub static mut STATE: GlobalState = GlobalState::new();

macro_rules! export_ptr {
    ($type: ty,$rust_name:ident, $js_name:literal, $array:expr) => {
        #[wasm_bindgen(js_name = $js_name)]
        pub fn $rust_name() -> *const $type {
            unsafe { $array.as_ptr() }
        }
    };
}

export_ptr!(f32, get_samples_ptr, "gsp", STATE.samples);
export_ptr!(f32, get_amplitudes_ptr, "gap", STATE.amps);
export_ptr!(f32, get_phases_ptr, "gpp", STATE.phases);
export_ptr!(u8, get_gate_ptr, "ggp", STATE.gate);
export_ptr!(u8, get_notes_ptr, "gnp", STATE.notes);

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=Math)]
    fn atan2(im: f32, re: f32) -> f32;

    #[wasm_bindgen(js_namespace=Math)]
    fn sin(x: f32) -> f32;

    #[wasm_bindgen(js_namespace=Math)]
    fn cos(x: f32) -> f32;

    #[wasm_bindgen(js_namespace=Math)]
    fn sqrt(x: f32) -> f32;
}

#[wasm_bindgen(js_name = "ana")]
pub fn analyze() {
    let spectrum = unsafe { microfft::real::rfft_64(&mut STATE.samples) };

    for (i, c) in spectrum.iter().enumerate() {
        let re = c.re;
        let im = c.im;

        let amp = sqrt(re * re + im * im);
        let phs = atan2(im, re);

        unsafe {
            STATE.amps[i] = amp;
            STATE.phases[i] = phs;
        }
    }
}

#[wasm_bindgen(js_name = "syn")]
pub fn synthesize() {
    let mut spectrum: [Complex32; BUFFER_SIZE] = [Complex32 { re: 0.0, im: 0.0 }; BUFFER_SIZE];
    for (i, s) in spectrum.iter_mut().enumerate().take(BUFFER_SIZE) {
        unsafe {
            s.re = STATE.amps[i] * cos(STATE.phases[i]);
            s.im = STATE.amps[i] * sin(STATE.phases[i]);
        }
    }

    let time_domain = microfft::inverse::ifft_64(&mut spectrum);

    for (i, sample) in time_domain.iter().enumerate() {
        unsafe { STATE.samples[i] = sample.re }
    }
}
