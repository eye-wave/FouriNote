export function downloadBuffer(data: Uint8Array, filename: string, mimeType = 'audio/midi') {
	const blob = new Blob([data as BlobPart], { type: mimeType });

	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');

	a.href = url;
	a.download = filename;
	a.click();

	URL.revokeObjectURL(url);
}
