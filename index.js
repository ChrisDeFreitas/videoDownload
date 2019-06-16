
/*

Download youtube videos
	https://github.com/fent/node-ytdl-core
Quality format itags:
	https://godoc.org/github.com/rylio/ytdl

See also
	https://www.npmjs.com/package/vlc

Notes:
- download youtube videos of any quality level
- youtube requires that high definition videos be download as separate audio and video streams
- this app automatically combined audio and video streams into a .mkv file with ffmpeg
- app contrlled via cfg object

Usage
	1. get a youtube video url

	2. execute app:
			> node index.js

	3. enter video url

	4. select video stream

	5. if necessary select an audio stream

	6. wait for processing to complete
	- currently, you'll have to delete extra file manually
*/

const fs = require('fs');
const ytdl = require('ytdl-core');
const sanitize = require("sanitize-filename");
const formats = require('./node_modules/ytdl-core/lib/formats.js')
const rl = require('readline-sync');

var cfg = {
	url:'https://youtu.be/TnFWNk9rw40',
	title:'',
	cleanup:false,		//delete downloaded files used to make .mkv
	explorer:false,		//open windows explorer

	vitag:null,		//video itag
	vcn:null,			//video container
	res:null,			//video resolution
	vfn:null,			//video filename
	vabr:null,		//video audioBitrate
	vdlDone:null,

	aitag:null,		//audio itag
	acn:null,			//aduio container
	abr:null,			//audioBitrate
	afn:null,				//audio filename
	adlDone:null
}
var dl_formats = {audio:[], video:[], both:[]}
var startms = Date.now()

function getInfo(url, callback){
	ytdl.getInfo(url, {}, function(err, info){

		if(err)
			throw err

		cfg.title = info.title
		console.log('Video Title:', cfg.title)
		console.log('Video URL:', url)

		for(format of info.formats){
			let itag = formats[format.itag]
			if(itag == null){
				continue
			}
			itag = Object.assign({itag:format.itag}, itag)
/*
			if(cfg.vitag != null && cfg.vitag == format.itag){
				cfg.vcn = itag.container
				cfg.res = itag.resolution
				cfg.vfn = videoFn()
			}else
			if(cfg.aitag != null && cfg.aitag == format.itag){
				cfg.acn = itag.container
				cfg.abr = itag.audioBitrate
				cfg.afn = audioFn()
			}
*/
			//compile list of available forms
			if(itag.audioEncoding === null){
				dl_formats.video.push( itag )
				continue
			} else
			if(itag.resolution === null){
				dl_formats.audio.push( itag )
				continue
			}
			else{
				dl_formats.both.push( itag )
			}
		}
		sortFormats(dl_formats)

		console.log('\nAvailable audio and video formats (sorted by video resolution):')
		console.log('  ', 'itag', 'container', 'encoding', 'resolution', 'audioBitrate' )
		for(format of dl_formats.both){
			console.log('  ', format.itag, format.container, format.encoding, format.resolution, format.audioBitrate )
		}
		console.log('\nAvailable video only formats (sorted by video resolution):')
		console.log('  ', 'itag', 'container', 'encoding', 'resolution')
		for(format of dl_formats.video){
			console.log('  ', format.itag, format.container, format.encoding, format.resolution )
		}
		console.log('\nAvailable audio only formats (sorted by audio bitrate):')
		console.log('  ', 'itag', 'container', 'encoding', 'bitrate')
		for(format of dl_formats.audio){
			console.log('  ', format.itag, format.container, format.audioEncoding, format.audioBitrate)
		}

		if(callback != null)
			callback()
	})
}
function sortFormats(list){

	list.audio.sort(function(a, b) {
		a = a.audioBitrate
		b = b.audioBitrate
	  if (a > b) return 1
	  if (a < b) return -1
	  return 0
	})
	list.both.sort(function(a, b) {
		a = parseInt(a.resolution, 10)
		b = parseInt(b.resolution, 10)
	  if (a > b) return 1
	  if (a < b) return -1
	  return 0
	})
	list.video.sort(function(a, b) {
		a = parseInt(a.resolution, 10)
		b = parseInt(b.resolution, 10)
	  if (a > b) return 1
	  if (a < b) return -1
	  return 0
	})

}
function dl(url, itag, fn, msg, callback){
	let lastpcent = -1
	let start = Date.now()

	ytdl(url, { quality:itag })
	.on('progress',function(len, bytes, totalbytes){
		//console.log('progress', len, bytes, totalbytes)
		let pcent = Math.round( (bytes /totalbytes) *100)
		if(lastpcent == pcent) return
		lastpcent = pcent
		if(pcent %10 != 0) return
		console.log(`  ${msg}: ${pcent}%`)
		//console.log('  progress:', pcent+'%')
	})
	.on('end', () => {
	  console.log(`  ${msg} download complete - ${msecToStr(Date.now() - start)}`);
	  if(callback != null)
	  	callback(itag, fn)
	})
	.pipe( fs.createWriteStream(fn) )
}

//callbacks
function infoCallback(){
	//downloading audio and video components in parallel
	if(cfg.vfn != null && cfg.afn != null){
	  cfg.fn = fn()
		cfg.cleanup = rl.keyInYN('\nDelete unneccessary files?')
		console.log(`cfg.cleanup = ${cfg.cleanup}`)
	 }

	cfg.explorer = rl.keyInYN('\nOpen Windows Explorer when done?')
	console.log(`cfg.explorer = ${cfg.explorer}`)
	console.log('')

	if(cfg.vfn != null){
		console.log(`Video stream download:\n  ${cfg.vfn}`)
		dl(cfg.url, cfg.vitag, cfg.vfn, 'Video', videoCallback)
	}
	if(cfg.afn != null){
		console.log(`Audio stream download:\n  ${cfg.afn}`)
		dl(cfg.url, cfg.aitag, cfg.afn, 'Audio', audioCallback)
	}

	if(cfg.vfn == null && cfg.afn == null){
		console.log('Nothing to download for:', cfg.url)
		endtime()
	}
}
function videoCallback(itag, fn){
	//assume: (itag === cfg.vitag)
	cfg.vdlDone = true

	if(cfg.afn == null){			//nothing else to do
  	console.log(`Video file completed: ${cfg.vfn}`)
		endtime()
		return
	}

	if(cfg.adlDone == true)
		mkvBuild()
}
function audioCallback(itag, fn){
	//assume: (itag === cfg.aitag)
	cfg.adlDone = true

	if(cfg.fn == null){
  	console.log(`Audio file completed: ${cfg.afn}`)
		endtime()
		return
	}

	if(cfg.vdlDone == true)
		mkvBuild()
}
function mkvBuild(){
	//call ffmpeg to make mp4 file
// 	let cmd = `.\\bin\\ffmpeg.exe -i "${cfg.vfn}" -i "${cfg.afn}" -c:v copy -c:a aac -loglevel error -y "${cfg.fn}"`
 	let cmd = `.\\bin\\ffmpeg.exe -i "${cfg.vfn}" -i "${cfg.afn}" -c:v copy -c:a copy -loglevel error -y "${cfg.fn}"`
 	console.log('\nCreating:', cfg.fn)
  const { exec } = require('child_process');
  exec(cmd, (error, stdout, stderr) => {
	  if (error) {
	    console.error(`  exec error: ${error}`);
			endtime()
	  }else
	  if(stdout == ''){
	  	console.log('- .mkv file created!')
	  	cleanupFiles()
	  }
	  else{
		  console.log(`stdout: ${stdout}`);
	  	console.log(`stderr: ${stderr}`);
			endtime()
		}
	});
}
function cleanupFiles(){
	if(cfg.cleanup == true){
		console.log('cleanup')
		var fs = require('fs');
 		if(cfg.vfn != null)
 			fs.unlinkSync(cfg.vfn)
 		if(cfg.afn != null)
 			fs.unlinkSync(cfg.afn)
	}
	else{
		console.log('no cleanup')
	}
	endtime()
}
function endtime(){
  console.log(`Done. - ${msecToStr(Date.now() - startms)}\n`);
  if(cfg.explorer === true){
	  const { exec } = require('child_process');
//	  const path = require('path');
	  let cmd = 'explorer .'
/*
	  if(cfg.fn != null)
	  	cmd += `".\\${cfg.fn}"`
	  else
	  if(cfg.vfn != null)
	  	cmd += `".\\${cfg.vfn}"`
	  else
	  if(cfg.afn != null)
	  	cmd += `".\\${cfg.afn}"`)
*/
	  exec(cmd)
  }
}

function findFormat(itag, atype){
	//assume: atype == video || audio
	//assue atype == video: search dl_formats.both
	//
	let format = null
	if(atype == 'video'){
		format = dl_formats.both.find( format => {
			return (format.itag == itag)
		})
		if(format == null){
			format = dl_formats.video.find( format => {
				return (format.itag == itag)
			})
		}
	}
	if(format == null && atype == 'audio'){
		format = dl_formats.audio.find( format => {
			return (format.itag == itag)
		})
	}
	return format
}
function requestVideoItag(){
	itag = rl.question('\nEnter video itag: ')

  itag = itag.trim()
  if(itag == '') {
		process.exit(0)
	}

  let format = findFormat(itag, 'video')
  if(format == null){
  	console.log(`itag format not found for "${itag}"`)
  	requestVideoItag()
  	return
  }

	cfg.vitag = itag
	cfg.vcn = format.container
	cfg.res = format.resolution
	cfg.vabr= format.audioBitrate
	cfg.vfn = videoFn()
  console.log(`cfg.vitag = ${itag}: ${cfg.res} - ${cfg.vcn}`);

	if(format.audioBitrate == null)
  	requestAudioItag()
  else
		infoCallback()
}
function requestAudioItag(){
	itag = rl.question('\nEnter audio itag: ')

  itag = itag.trim()
  if(itag != '') {
	  let format = findFormat(itag, 'audio')
	  if(format == null){
	  	console.log(`itag format not found for "${itag}"`)
	  	requestAudioItag()
	  	return
	  }

		cfg.aitag = itag
		cfg.acn = format.container
		cfg.abr = format.audioBitrate
		cfg.afn = audioFn()
	  console.log(`cfg.aitag = ${itag}: ${cfg.abr} - ${cfg.acn}`);
	}

	infoCallback()
}
function videoFn(){
	if(cfg.vabr == null)		//video only
		return sanitize(`${cfg.title} - ${cfg.res} - ${cfg.vitag}.${cfg.vcn}`)
	else
		return sanitize(`${cfg.title} - ${cfg.res}.${cfg.vcn}`)
}
function audioFn(){
	return sanitize(`${cfg.title} - ${cfg.abr} - ${cfg.aitag}.${cfg.acn}`)
}
function fn(){
	return sanitize(`${cfg.title} - ${cfg.res}.mkv`)
}

function msecToStr(msec){
 if(msec < 1000) return msec+'ms'
 if(msec < (1000 *60)) return (Math.round(msec /1000*100) /100)+'s'
 if(msec < (1024 *60 *60)) return (Math.round(msec /1000/60*100) /100)+'m'
 return (Math.round(msec /1000/60/60 *100) /100)+'h'
}

//start
url = rl.question('Youtube video URL: ')

url = url.trim()
if(url == '') {
	process.exit(0)
}

cfg.url = url
console.log(`cfg.url: ${url}\n`);

getInfo(cfg.url, requestVideoItag)

/*

*/