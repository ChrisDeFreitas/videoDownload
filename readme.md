# videoDownload

This is a simple nodejs console application that downloads Youtube videos.  This is my archive of the source code. Feel free to use and modify as you wish.

I created the application to replace browser pluggins because they either failed or presented serious security risks.  I originally planned to include the code in my file utility application, <a href="https://github.com/ChrisDeFreitas/Electron-FolderView" >FolderView</a>.  But as I developed the alogrithms and concepts it became clear that the code would work well as console application.  Special thanks to <a href="https://www.npmjs.com/package/readline-sync">readline-sync</a> and
<a href="https://www.npmjs.com/package/ytdl-core">ytdl-core</a>.


## Features
- download any available quality of video
- uses FFmpeg to combine video and audio streams into a .mkv file
- has a batch file that can be use as Windows Desktop shortcut
- built for Windows but should be easy to convert to Linux


## Requires
- the ./bin folder contains a binary copy of FFmpeg.exe.  FFmpeg is only used to combine audio and video streams--downloading will work without it, however, the app will try to combine video and audio streams downloaded together.


## Usage
<br>
	0. download sources files and install:<br>
> npm install<br>
<br>
	1. get a youtube video url, try it with my new favorite band:<br>
	https://www.youtube.com/watch?v=iOHkyZ62jjQ&list=PLZE9LGuGzyzYFIbGXH0chia8agBBNgBgi<br>
<br>
	2. Run the app with any of the following methods:<br>
> npm test<br>
> node index.js<br>
> videoDownload.bat<br>
<br>
	3. paste video url (right-click, select paste)<br>
<br>
	4. select video stream<br>
<br>
	5. if necessary select an audio stream<br>
<br>
	6. select other relevant options<br>
<br>
	7. wait for processing to complete<br>
<br>
	8. if running videoDownload.bat, close the app with Alt+F4

## ToDo
- allow videos to be launched after download
- use readlineSync.keyInSelect to simplify selecting streams
- currenlty stores vides in project root, eventually this should change

## Thanks to

https://ffmpeg.org
https://www.npmjs.com/package/readline-sync
https://www.npmjs.com/package/sanitize-filename
https://www.npmjs.com/package/ytdl-core
https://youtube.com


Chris, chrisd@europa.com