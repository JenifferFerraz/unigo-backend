export class CreateCourseDto {
    name: string;
    period: number;
    shift: 'matutino' | 'vespertino' | 'noturno';
    className: string;
}

