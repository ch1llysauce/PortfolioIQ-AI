import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-project-analysis-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './project-analysis-modal.component.html',
  host: { style: 'display: contents;' }
})
export class ProjectAnalysisModalComponent {
  public app = inject(App);
}
