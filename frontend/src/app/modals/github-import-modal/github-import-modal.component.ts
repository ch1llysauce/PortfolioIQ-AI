import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-github-import-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './github-import-modal.component.html',
  host: { style: 'display: contents;' }
})
export class GithubImportModalComponent {
  public app = inject(App);
}
