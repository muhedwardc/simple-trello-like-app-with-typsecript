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

        if (title.trim().length <= 0 || desc.trim().length <= 0 || parseInt(people.trim()) <= 0) {
            alert('Invalid input, please try again!');
            return;
        } else {
            return [title, desc, +people];
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
            console.log({title, desc, people});
            this.resetForm();
        }
    }
}

const projectInput = new ProjectInput();