import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('video', { static: false }) video: ElementRef;
  videoElement: any;
  cameraActive = false;
  isMobile = false;
  isIOS = false;
  frontCamera = false;

  constructor(public platform: Platform) {
    if (this.platform.is('mobile')) {
      this.isMobile = true;
      this.frontCamera = true;

      if (this.platform.is('ios')) {
        this.isIOS = true;
      }
    }
  }

  // tslint:disable-next-line: use-lifecycle-interface
  ngAfterViewInit() {
    this.videoElement = this.video.nativeElement;
  }

  async openCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: this.frontCamera ? 'user' : 'environment'}
    });

    this.videoElement.srcObject = stream;
    if (this.isIOS) {
      this.videoElement.setAttribute('playsinline', true);
    }

    this.videoElement.play();
    this.cameraActive = true;
  }

  closeCamera() {
    this.videoElement.pause();
    this.cameraActive = false;
  }
}
