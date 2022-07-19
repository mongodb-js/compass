interface SpeechRecognitionEvents {
	audioend: Event;
	audiostart: Event;
	end: Event;
	error: SpeechRecognitionErrorEvent;
	nomatch: SpeechRecognitionEvent;
	result: SpeechRecognitionEvent;
	soundend: Event;
	soundstart: Event;
	speechend: Event;
	speechstart: Event;
	start: Event;
}

declare class SpeechGrammar {
	/** The src property of the SpeechGrammar interface sets and returns a string containing the grammar from within in the SpeechGrammar object. */
	src: string;
	/** A float representing the weight of the grammar, in the range 0.0–1.0. */
	weight: number;
}

declare class SpeechGrammarList {
	length: number;
	/** The addFromString() method of the SpeechGrammarList interface takes a grammar present in a specific string within the code base (e.g. stored in a variable) and adds it to the SpeechGrammarList as a new SpeechGrammar object. */
	addFromString(string: string, weight?: number);
	/** A float representing the weight of the grammar relative to other grammars present in the SpeechGrammarList. The weight means the importance of this grammar, or the likelihood that it will be recognized by the speech recognition service. The value can be between 0.0 and 1.0; If not specified, the default used is 1.0. */
	addFromURI(src: string, weight?: number);
	item(index: number);
}

declare class SpeechRecognitionEvent extends Event {
	resultIndex: number;
	results: SpeechRecognitionResultList;
}

declare class SpeechRecognitionErrorEvent extends Event {
	error:
		| 'no-speech'
		| 'aborted'
		| 'audio-capture'
		| 'network'
		| 'not-allowed'
		| 'service-not-allowed'
		| 'bad-grammar'
		| 'language-not-supported';
	message: string;
}

declare class SpeechRecognition extends EventTarget {
	continuous: boolean;
	grammars: SpeechGrammarList;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	// eslint-disable-next-line @typescript-eslint/no-misused-new
	new(): SpeechRecognition;

	/**
	 * The abort() method of the Web Speech API stops the speech recognition service from listening to incoming audio, and doesn't attempt to return a SpeechRecognitionResult.
	 */
	abort(): void;
	/**
	 * The start() method of the Web Speech API starts the speech recognition service listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
	 */
	start();
	/**
	 * The stop() method of the Web Speech API stops the speech recognition service from listening to incoming audio, and attempts to return a SpeechRecognitionResult using the audio captured so far.
	 */
	stop();

	override addEventListener<EventName extends keyof SpeechRecognitionEvents>(
		type: EventName,
		callback: (event: SpeechRecognitionEvents[EventName]) => void,
		options?: AddEventListenerOptions
	): void;
}

declare global {
	type SpeechRecognition = InstanceType<typeof SpeechRecognition>;
	type SpeechGrammar = InstanceType<typeof SpeechGrammar>;
	type SpeechGrammarList = InstanceType<typeof SpeechGrammarList>;
	type SpeechRecognitionEvent = InstanceType<typeof SpeechRecognitionEvent>;
	interface Window {
		webkitSpeechRecognition: { new (): SpeechRecognition };
		webkitSpeechGrammarList: { new (): SpeechGrammarList };
		webkitSpeechRecognitionEvent: { new (): SpeechRecognitionEvent };
		webkitSpeechGrammar: { new (): SpeechGrammar };
		SpeechRecognition: { new (): SpeechRecognition };
		SpeechGrammar: { new (): SpeechGrammar };
		SpeechGrammarList: { new (): SpeechGrammarList };
		SpeechRecognitionEvent: { new (): SpeechRecognitionEvent };
	}
}
export {};
