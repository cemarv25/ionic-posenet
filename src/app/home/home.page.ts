import { Component, ElementRef, ViewChild } from '@angular/core';
import { PickerController, Platform } from '@ionic/angular';
import { PickerOptions } from '@ionic/core';
import { drawKeypoints, drawSkeleton } from '../utils/posenet-utils';
import * as posenet from '@tensorflow-models/posenet';
import '@tensorflow/tfjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  cameraActive = false;
  isMobile = false;
  isIOS = false;
  frontCamera = false;
  netOpts = {};
  @ViewChild('videoInput') videoRef: ElementRef;
  @ViewChild('output') canvasRef: ElementRef;
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  videoStream: MediaStream;
  net = null;

  constructor(public platform: Platform, private pickerCtrl: PickerController) {
    if (this.platform.is('mobile')) {
      this.isMobile = true;
      this.frontCamera = true;

      if (this.platform.is('ios')) {
        this.isIOS = true;
      }
    }
  }

  async ngAfterViewInit() {
    const videoWidth = this.isMobile ? 400 : 640;
    const videoHeight = this.isMobile ? 533 : 480;

    this.net = await posenet.load({
      inputResolution: { width: videoWidth, height: videoHeight },
      architecture: 'MobileNetV1',
      outputStride: this.isMobile ? 8 : 16,
    });
  }

  async openCamera() {
    this.videoElement = this.videoRef.nativeElement;
    this.canvasElement = this.canvasRef.nativeElement;
    this.videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });

    this.videoElement.srcObject = this.videoStream;
    if (this.isIOS) {
      this.videoElement.setAttribute('playsinline', 'true');
    }

    this.videoElement.play();
    this.cameraActive = true;
  }

  closeCamera() {
    this.videoElement.pause();
    this.cameraActive = false;

    this.videoStream.getTracks().forEach((track) => {
      if (track.readyState === 'live' && track.kind === 'video') {
        track.stop();
      }
    });
  }

  async openPicker() {
    const pickerColOpts = [
      { text: 'Single Pose', value: 'single-pose' },
      { text: 'Multi Pose', value: 'multi-pose' },
    ];

    const pickerBtns = [{ text: 'Confirm' }];

    const options: PickerOptions = {
      buttons: pickerBtns,
      columns: [
        {
          name: 'Algorithm',
          options: pickerColOpts,
        },
      ],
    };
    const picker = await this.pickerCtrl.create(options);
    picker.present();
    picker.onDidDismiss().then(async (data) => {
      console.log('data after dismiss: ', data);
      const alg = await picker.getColumn('Algorithm');
      console.log('algorithm: ', alg.options[alg.selectedIndex]);
      // tslint:disable-next-line: no-string-literal
      this.netOpts['algorithm'] = alg.options[alg.selectedIndex].value;
      console.log(this.netOpts);
    });
  }

  async startPoseDetection() {
    setInterval(() => {
      this.detectSinglePose(this.net);
    }, 100);
  }

  async detectSinglePose(net: posenet.PoseNet) {
    if (this.cameraActive) {
      // Get video properties
      const video = document.getElementById('video-input') as HTMLVideoElement;
      const videoWidth = this.videoRef.nativeElement.videoWidth;
      const videoHeight = this.videoRef.nativeElement.videoHeight;

      // Set video properties
      this.videoRef.nativeElement.width = videoWidth;
      this.videoRef.nativeElement.height = videoHeight;

      const canvas = this.canvasElement;
      // Make detections
      const pose = await net.estimateSinglePose(video);
      console.log(pose);
      this.drawCanvas(pose, video, canvas);
    }
  }

  drawCanvas(pose, video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    canvas.height = video.height;
    canvas.width = video.width;

    // tslint:disable-next-line: no-string-literal
    drawKeypoints(pose['keypoints'], 0.5, ctx);
    // tslint:disable-next-line: no-string-literal
    drawSkeleton(pose['keypoints'], 0.5, ctx);
  }
}
