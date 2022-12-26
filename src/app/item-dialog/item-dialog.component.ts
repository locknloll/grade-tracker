import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { Item } from '../item';

@Component({
  selector: 'app-item-dialog',
  templateUrl: './item-dialog.component.html',
  styleUrls: ['./item-dialog.component.css']
})
export class ItemDialogComponent implements OnInit {

  constructor(public dialogRef: MatDialogRef<ItemDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: ItemDialogData) { }

  ngOnInit(): void {
  }

  cancel(): void {
    this.dialogRef.close();
  }

}

export interface ItemDialogData {
  item: Partial<Item>;
  enableDelete: boolean;
}

export interface ItemDialogResult {
  item: Item;
  delete?: boolean;
}