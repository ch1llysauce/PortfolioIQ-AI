import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-coach]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach.component.html'
})
export class CoachComponent {
  public app = inject(App);
}
