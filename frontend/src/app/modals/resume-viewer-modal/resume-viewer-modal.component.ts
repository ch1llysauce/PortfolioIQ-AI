import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-resume-viewer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resume-viewer-modal.component.html',
  host: { style: 'display: contents;' }
})
export class ResumeViewerModalComponent {
  public app = inject(App);
}
