declare module 'msgpackr/index-no-eval' {
	export class Packr {
		pack(data: any): Buffer;
		unpack(data: Buffer | ArrayBuffer | string): any;
	}
}
