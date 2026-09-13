import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-github-guide-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './github-guide-modal.component.html',
  host: { style: 'display: contents;' }
})
export class GithubGuideModalComponent {
  public app = inject(App);
}
