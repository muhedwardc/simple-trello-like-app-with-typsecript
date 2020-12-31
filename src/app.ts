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

        this.titleInputEl = <HTMLInputElement>this.formEl.getElementById('title')!
        this.descriptionInputEl = <HTMLTextAreaElement>this.formEl.getElementById('description')!
        this.peopleInputEl = <HTMLInputElement>this.formEl.getElementById('people')!

        this.configure();
        this.attach();
    }

    private attach() {
        this.hostEl.insertAdjacentElement('afterbegin', this.formEl);
    }

    private configure() {
        this.formEl.addEventListener('submit', this.submitHandler.bind(this));
    }

    private submitHandler(event: Event) {
        event.preventDefault();
    }
}

const projectInput = new ProjectInput();