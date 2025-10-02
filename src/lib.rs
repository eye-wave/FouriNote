use std::convert::TryInto;
use std::f32::consts::PI;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    pub fn log(s: &str);
}

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn analyze() {
    let sample_count = 16;
    let signal_freq = 3.;
    let sample_interval = 1. / sample_count as f32;
    let samples: Vec<_> = (0..sample_count)
        .map(|i| (2. * PI * signal_freq * sample_interval * i as f32).sin())
        .collect();

    // compute the RFFT of the samples
    let mut samples: [_; 16] = samples.try_into().unwrap();
    let spectrum = microfft::real::rfft_16(&mut samples);
    // since the real-valued coefficient at the Nyquist frequency is packed into the
    // imaginary part of the DC bin, it must be cleared before computing the amplitudes
    spectrum[0].im = 0.0;

    // the spectrum has a spike at index `signal_freq`
    let amplitudes: Vec<_> = spectrum.iter().map(|c| c.norm() as u32).collect();

    log(&format!("{samples:?}"));
    log(&format!("{amplitudes:?}"));
}
