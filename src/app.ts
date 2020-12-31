interface ValidatorInterface {
    value: string | number;
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number
}

function validate({ 
    value, 
    required, 
    minLength, 
    maxLength, 
    min, 
    max
}: ValidatorInterface) {
    let isValid = true;

    if (required) {
        isValid = isValid && value.toString().trim().length > 0;
    }
    if (minLength != null && typeof value === 'string') {
        isValid = isValid && value.trim().length > minLength
    }
    if (maxLength != null && typeof value === 'string') {
        isValid = isValid && value.trim().length < maxLength
    }
    if (min != null && typeof value === 'number') {
        isValid = isValid && value > min;
    }
    if (max != null && typeof value === 'number') {
        isValid = isValid && value <= max;
    }

    return isValid;
}

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const adjustedDecorator: PropertyDescriptor = {
        configurable: true,
        get() {
            const boundFn = originalMethod.bind(this);
            return boundFn;
        }
    }
    return adjustedDecorator;
}

class ProjectState {
    private listeners: any[] = [];
    private projects: any[] = [];
    private static instance: ProjectState;

    private constructor() {

    }

    static getInstance() {
        if (this.instance) {
            return this.instance
        } 

        this.instance = new ProjectState();
        return this.instance;
    }

    addListener(listenerFn: Function) {
        this.listeners.push(listenerFn);
    }

    addProject(title: string, description: string, people: number) {
        const newProject = {
            id: new Date().getTime(),
            title,
            description,
            people
        }
        this.projects.push(newProject);
        for (const listenerFn of this.listeners) {
            listenerFn(this.projects.slice());
        }
    }
}

const projectState = ProjectState.getInstance();

class ProjectInput {
    templateEl: HTMLTemplateElement;
    hostEl: HTMLDivElement;
    formEl: HTMLFormElement;
    titleInputEl: HTMLInputElement;
    descriptionInputEl: HTMLTextAreaElement;
    peopleInputEl: HTMLInputElement;

    constructor() {
        this.templateEl = <HTMLTemplateElement>document.getElementById('project-input')!;
        this.hostEl = <HTMLDivElement>document.getElementById('app')!;

        const importedContentNode = document.importNode(this.templateEl.content, true);
        this.formEl = <HTMLFormElement>importedContentNode.firstElementChild;
        this.formEl.id = 'user-input';

        this.titleInputEl = <HTMLInputElement>this.formEl.querySelector('#title')!
        this.descriptionInputEl = <HTMLTextAreaElement>this.formEl.querySelector('#description')!
        this.peopleInputEl = <HTMLInputElement>this.formEl.querySelector('#people')!

        this.configure();
        this.attach();
    }

    private attach() {
        this.hostEl.insertAdjacentElement('afterbegin', this.formEl);
    }

    private configure() {
        this.formEl.addEventListener('submit', this.submitHandler);
    }

    private getUserInput(): [string, string, number] | void {
        const title = this.titleInputEl.value;
        const desc = this.descriptionInputEl.value;
        const people = this.peopleInputEl.value;

        const titleValidator: ValidatorInterface = { value: title, required: true}; 
        const descValidator: ValidatorInterface = { value: desc, required: true, minLength: 8}; 
        const peopleValidator: ValidatorInterface = { value: +people, required: true, min: 1, max: 10}; 

        if (
            validate(titleValidator) && 
            validate(descValidator) && 
            validate(peopleValidator)
        ) {
            return [title, desc, +people];
        } else {
            alert('Invalid input, please try again!');
            return;
        }
    }

    private resetForm() {
        this.titleInputEl.value = '';
        this.descriptionInputEl.value = '';
        this.peopleInputEl.value = '';
    }

    @autobind
    private submitHandler(event: Event) {
        event.preventDefault();

        const userInput = this.getUserInput();
        if (Array.isArray(userInput)) {
            const [title, desc, people] = userInput;
            projectState.addProject(title, desc, people);
            this.resetForm();
        }
    }
}

class ProjectList {
    templateEl: HTMLTemplateElement;
    hostEl: HTMLDivElement;
    listEl: HTMLElement;
    assignedProjects: any[] = [];

    constructor(private type: 'onprogress' | 'done') {
        this.templateEl = <HTMLTemplateElement>document.getElementById('project-list')!;
        this.hostEl = <HTMLDivElement>document.getElementById('app')!;

        const importedContentNode = document.importNode(this.templateEl.content, true);
        this.listEl = <HTMLElement>importedContentNode.firstElementChild;
        this.listEl.id = `${this.type}-projects`;

        projectState.addListener((projects: any[]) => {
            this.assignedProjects = projects;
            this.renderProjects();
        });

        this.attach();
        this.renderContent();
    }

    private renderProjects() {
        const listEl = <HTMLUListElement>document.getElementById(`${this.type}-projects-list`)!;
        for(const item of this.assignedProjects) {
            const listItem = document.createElement('li');
            listItem.textContent = item.title;
            listEl?.appendChild(listItem);
        }
    }

    private renderContent() {
        const listId = `${this.type}-projects-list`;
        this.listEl.querySelector('ul')!.id = listId;
        this.listEl.querySelector('h2')!.textContent = this.type.toUpperCase();
    }

    private attach() {
        this.hostEl.insertAdjacentElement('beforeend', this.listEl);
    }
}

const projectInput = new ProjectInput();
const onprogressProjects = new ProjectList('onprogress');
const doneProjects = new ProjectList('done');