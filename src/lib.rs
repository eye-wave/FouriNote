#![allow(static_mut_refs)]

use microfft::Complex32;
use wasm_bindgen::prelude::*;

const BUFFER_SIZE: usize = 64;

pub static mut GATE: [u8; BUFFER_SIZE] = [1; BUFFER_SIZE];
pub static mut SAMPLES: [f32; BUFFER_SIZE] = [0.0; BUFFER_SIZE];
static mut AMPLITUDES: [f32; BUFFER_SIZE] = [0.0; BUFFER_SIZE];
static mut PHASES: [f32; BUFFER_SIZE] = [0.0; BUFFER_SIZE];

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

macro_rules! export_ptr {
    ($type: ty,$rust_name:ident, $js_name:literal, $array:ident) => {
        #[wasm_bindgen(js_name = $js_name)]
        pub fn $rust_name() -> *const $type {
            unsafe { $array.as_ptr() }
        }
    };
}

export_ptr!(f32, get_samples_ptr, "getSamplesPtr", SAMPLES);
export_ptr!(f32, get_amplitudes_ptr, "getAmplitudesPtr", AMPLITUDES);
export_ptr!(f32, get_phases_ptr, "getPhasesPtr", PHASES);
export_ptr!(u8, get_gate_ptr, "getGatePtr", GATE);

#[wasm_bindgen]
pub fn analyze() {
    unsafe {
        let mut samples_copy = SAMPLES;
        let spectrum = microfft::real::rfft_64(&mut samples_copy);

        for (i, c) in spectrum.iter().enumerate() {
            AMPLITUDES[i] = c.norm();
            PHASES[i] = c.arg();
        }
    }
}
#[wasm_bindgen]
pub fn synthesize() {
    unsafe {
        let mut spectrum: [Complex32; BUFFER_SIZE] = [Complex32 { re: 0.0, im: 0.0 }; BUFFER_SIZE];
        for i in 0..BUFFER_SIZE {
            spectrum[i].re = AMPLITUDES[i] * PHASES[i].cos();
            spectrum[i].im = AMPLITUDES[i] * PHASES[i].sin();
        }

        let time_domain = microfft::inverse::ifft_64(&mut spectrum);

        for (i, sample) in time_domain.iter().enumerate() {
            SAMPLES[i] = sample.re;
        }
    }
}
