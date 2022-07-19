export class Speaker {
	voices: SpeechSynthesisVoice[] = [];
	voice?: SpeechSynthesisVoice;
	constructor() {
		speechSynthesis.addEventListener('voiceschanged', () => {
			this.voices = speechSynthesis.getVoices();
			this.voice = this.voices.find(
				(voice) => voice.name === 'Google US English'
			);
		});
		this.voices = speechSynthesis.getVoices();
		this.voice = this.voices.find(
			(voice) => voice.name === 'Google US English'
		);
	}

	makeUtterance(text: string) {
		const utterance = new SpeechSynthesisUtterance(text);
		if (this.voice != null) utterance.voice = this.voice;
		return utterance;
	}

	speak(text: string) {
		speechSynthesis.speak(this.makeUtterance(text));
	}
}

export const SpeechRecognition =
	window.SpeechRecognition ?? window.webkitSpeechRecognition;
export const SpeechGrammarList =
	window.SpeechGrammarList ?? window.webkitSpeechGrammarList;
export const SpeechRecognitionEvent =
	window.SpeechRecognitionEvent ?? window.webkitSpeechRecognitionEvent;
export const SpeechGrammar = window.SpeechGrammar ?? window.webkitSpeechGrammar;


const grammar = `#JSGF V1.0;
grammar colors;
public <color> = aqua | blue | red;
`;

export class LeafyListener {
	speechRecognition: SpeechRecognition;
	started: boolean;
	speaker: Speaker;
	constructor() {
		this.started = false;
		this.speechRecognition = new SpeechRecognition();
		this.speechRecognition.continuous = true;
		this.speechRecognition.lang = 'en-US';
		this.speechRecognition.interimResults = false;
		this.speechRecognition.maxAlternatives = 1;
		this.speechRecognition.grammars = new SpeechGrammarList();
		this.speechRecognition.grammars.addFromString(grammar, 1);
		this.speaker = new Speaker();

		this.speechRecognition.addEventListener('result', (ev) =>
			this.onResult(ev)
		);
	}

	start() {
		// this.speaker.speak('Yes, you called?');
		if (!this.started) this.speechRecognition.start();
		this.started = true;
	}

	stop() {
		this.speechRecognition.stop();
	}

	onResult(ev: SpeechRecognitionEvent): void {
		for (const recognition of ev.results) {
			for (const result of recognition) {
				console.log(result.confidence.toFixed(4), result.transcript);
				this.speaker.speak(result.transcript);
			}
		}
	}
}
