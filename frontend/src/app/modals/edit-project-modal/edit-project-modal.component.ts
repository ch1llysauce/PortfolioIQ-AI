import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'app-edit-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-project-modal.component.html',
  host: { style: 'display: contents;' }
})
export class EditProjectModalComponent {
  public app = inject(App);
}
