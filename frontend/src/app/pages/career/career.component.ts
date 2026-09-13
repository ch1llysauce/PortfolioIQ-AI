import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-career]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './career.component.html'
})
export class CareerComponent {
  public app = inject(App);
}
