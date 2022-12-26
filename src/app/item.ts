import { Course } from "./course";

export interface Item {
    id?: string;
    name: string;
    grade: number;
    outOf: number;
    weight: number;
    course: Course;
}