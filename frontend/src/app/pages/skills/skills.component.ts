import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-skills]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './skills.component.html'
})
export class SkillsComponent {
  public app = inject(App);
}
