import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-resume]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resume.component.html'
})
export class ResumeComponent {
  public app = inject(App);
}
