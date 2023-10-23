export namespace main {
	
	export class Config {
	    setup_done: boolean;
	    version: number;
	    music_directories: string[];
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.setup_done = source["setup_done"];
	        this.version = source["version"];
	        this.music_directories = source["music_directories"];
	    }
	}

}

