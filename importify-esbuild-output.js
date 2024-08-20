import { readFileSync } from 'fs';
var arg = process.argv[2];
var data = !arg || arg == '-' ? readFileSync(0, 'utf-8') : readFileSync(arg, 'utf-8');
var rx =
	/\b__require\("(_http_agent|_http_client|_http_common|_http_incoming|_http_outgoing|_http_server|_stream_duplex|_stream_passthrough|_stream_readable|_stream_transform|_stream_wrap|_stream_writable|_tls_common|_tls_wrap|assert|async_hooks|buffer|child_process|cluster|console|constants|crypto|dgram|diagnostics_channel|dns|domain|events|fs|http|http2|https|inspector|module|net|os|path|perf_hooks|process|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|trace_events|tty|url|util|v8|vm|wasi|worker_threads|zlib)"\)/gm;
var modules = new Map();
var out = data.replace(rx, function (req, mod) {
	var id = '__import_' + mod.toUpperCase();
	modules.set(mod, id);
	return id;
});
modules.forEach(function (val, key) {
	console.log('import %s from %s;', val, JSON.stringify(key));
});
console.log('\n%s', out);
