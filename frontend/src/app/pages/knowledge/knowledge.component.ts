import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../app';

@Component({
  selector: 'div[app-knowledge]',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge.component.html'
})
export class KnowledgeComponent {
  public app = inject(App);
}
