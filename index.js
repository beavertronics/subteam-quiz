let currentQuestionIndex = 0;
let quizData = null;
const selectedAnswers = {}; // stores selected answer per question
let userEmail = null; // stores the user's email

function showLoadError(container) {
    if (!container) return;
    container.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'question-card';
    const title = document.createElement('h2');
    title.className = 'question-title';
    title.textContent = 'Unable to load quiz';
    card.appendChild(title);

    const p = document.createElement('p');
    p.className = 'result-desc';
    p.textContent = 'There was a problem loading the quiz data. Please try again once SOMEBODY fixes it.';
    card.appendChild(p);

    container.appendChild(card);
}

async function loadQuizData() {
    const container = document.getElementById('questions');

    try {
        const quizJson = await fetch('quiz.json');
        if (!quizJson.ok) {
            throw new Error(`Failed to fetch quiz data (Status: ${quizJson.status})`); // quiz fetch error
        }
        const data = await quizJson.json();
        if (!data?.questions?.length) {
            throw new Error('Quiz data is empty/invalid'); // fetched, but quiz empty/invalid error
        }

        quizData = data;
        showQuestion(currentQuestionIndex); // show the first question after loading
        return quizData;

    } catch (error) {
        console.error('Error loading quiz data:', error); // log error
        if (container) showLoadError(container); // display error
    }
}

function createBackButton() {
    const backBtn = document.createElement('button');
    backBtn.className = 'submit-btn back-btn';
    backBtn.type = 'button';
    backBtn.textContent = 'Back';
    backBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
        }
    });
    return backBtn;
}

function createSubmitButton({ text = 'Submit', type = 'button', onClick = null, classes = [], disabled = false } = {}) {
    const btn = document.createElement('button');
    btn.type = type;
    btn.className = 'submit-btn' + (classes.length ? ' ' + classes.join(' ') : '');
    btn.textContent = text;
    btn.disabled = Boolean(disabled);
    if (onClick && type !== 'submit') btn.addEventListener('click', onClick);
    return btn;
}

function showQuestion(index) {
    const container = document.getElementById('questions');
    if (!container) return;
    if (!quizData) return;

    container.innerHTML = '';

    const q = quizData.questions[index];

    // collect email before showing results
    if (!q) {
        if (!userEmail) {
            showEmailPrompt(container);
        } else {
            showResults(container);
        }
        return;
    }

    const card = document.createElement('div');
    card.className = 'question-card';

    // question image
    if (q.image && !q.image.includes('PLACEHOLDER')) {
        const img = document.createElement('img');
        img.className = 'question-image';
        img.src = q.image;
        img.alt = `Question ${index + 1} Image`;
        card.appendChild(img);
    }

    // question title and quiz progress
    const title = document.createElement('h2');
    title.className = 'question-title';
    title.textContent = `${index + 1} of ${quizData.questions.length}. ${q.question}`;
    card.appendChild(title);

    // options grid
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'options-grid';

    q.answers.forEach((answer) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.type = 'button';
        btn.textContent = answer.label;
        btn.setAttribute('aria-pressed', 'false');
        btn.setAttribute('data-answer-id', answer.id);

        if (selectedAnswers[q.id] === answer.id) {
            btn.classList.add('selected');
            btn.setAttribute('aria-pressed', 'true');
        }

        // click and keyboard support
        btn.addEventListener('click', () => {
            optionsGrid.querySelectorAll('.option-btn').forEach(b => {
                b.classList.remove('selected');
                b.setAttribute('aria-pressed', 'false');
            });
            btn.classList.add('selected');
            btn.setAttribute('aria-pressed', 'true');
            selectedAnswers[q.id] = answer.id;
            submitBtn.disabled = false;
        });
        btn.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                btn.click();
            }
        });

        optionsGrid.appendChild(btn);
    });

    card.appendChild(optionsGrid);

    // action row (back + submit)
    const actions = document.createElement('div');
    actions.className = 'action-row';

    const backBtn = createBackButton();
    backBtn.disabled = index === 0;
    actions.appendChild(backBtn);

    // submit / next button
    const submitBtn = createSubmitButton({
        text: index === quizData.questions.length - 1 ? 'Finish' : 'Next Question',
        onClick: () => { currentQuestionIndex++; showQuestion(currentQuestionIndex); },
        disabled: !selectedAnswers[q.id]
    });

    actions.appendChild(submitBtn);

    card.appendChild(actions);
    container.appendChild(card);
}

// prompt for email before revealing results
function showEmailPrompt(container) {
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'question-card';

    const title = document.createElement('h2');
    title.className = 'question-title';
    title.textContent = 'Almost Done!';
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'result-desc';
    desc.textContent = 'Enter your email to see your results and be added to the \"interested\" email list!';
    card.appendChild(desc);

    const form = document.createElement('form');
    form.className = 'email-form';

    const label = document.createElement('label');
    label.textContent = 'Email address';
    label.htmlFor = 'email-input-field';
    label.className = 'email-label';

    const input = document.createElement('input');
    input.id = 'email-input-field';
    input.type = 'email';
    input.className = 'email-input';
    input.placeholder = 'namey.mcnameface@gmail.com';
    input.required = true;

    const feedback = document.createElement('div');
    feedback.className = 'email-feedback';
    feedback.setAttribute('aria-live', 'polite');

    const submitBtn = createSubmitButton({ text: 'See Results', type: 'submit', classes: ['no-top'] });

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(feedback);
    form.appendChild(submitBtn);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailVal = input.value.trim();

        // email validation (i stole this from an 18 year old stackoverflow answer)
        const re =
            /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        const isValid = re.test(emailVal);
        if (!isValid) {
            feedback.textContent = 'Please enter a valid email address.';
            input.focus();
            return;
        }

        userEmail = emailVal;

        // hello here is your email thingy
        // do something with this wonderful global variable idk
        console.log('Email:', userEmail);

        showResults(container);
    });

    card.appendChild(form);
    container.appendChild(card);
}

// helper for image + description
function appendResultBody(parent, item) {
    if (item.image && !item.image.includes('PLACEHOLDER')) {
        const img = document.createElement('img');
        img.className = 'question-image';
        img.src = item.image;
        img.alt = item.label;
        parent.appendChild(img);
    }

    if (item.description) {
        const desc = document.createElement('p');
        desc.className = 'result-desc';
        desc.textContent = item.description;
        parent.appendChild(desc);
    }
}

// calculate scores and show results
function showResults(container) {
    const scores = {};
    quizData.resultOptions.forEach(opt => scores[opt.id] = 0);
    let totalPoints = 0;

    quizData.questions.forEach(q => {
        const answerId = selectedAnswers[q.id];
        if (answerId) {
            const answer = q.answers.find(a => a.id === answerId);
            if (answer && answer.weights) {
                Object.entries(answer.weights).forEach(([subteam, points]) => {
                    if (scores[subteam] !== undefined) {
                        scores[subteam] += points;
                        totalPoints += points;
                    }
                });
            }
        }
    });

    const results = quizData.resultOptions.map(opt => {
        const score = scores[opt.id] || 0;
        const percentage = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        return { ...opt, score, percentage };
    }).sort((a, b) => b.score - a.score);

    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'question-card';

    const mainTitle = document.createElement('h2');
    mainTitle.className = 'question-title';
    mainTitle.textContent = 'Your Subteam Results';
    card.appendChild(mainTitle);

    results.forEach((item, index) => {
        if (index === 0) {
            const topBox = document.createElement('div');
            topBox.className = 'top-result';

            const resTitle = document.createElement('h3');
            resTitle.className = 'result-title';
            resTitle.textContent = `Best Match: ${item.label} — ${item.percentage}%`;
            topBox.appendChild(resTitle);

            appendResultBody(topBox, item);
            card.appendChild(topBox);
        } else {
            const details = document.createElement('details');
            details.className = 'result-details';

            const summary = document.createElement('summary');
            summary.className = 'result-summary';
            summary.textContent = `${item.label} — ${item.percentage}%`;
            details.appendChild(summary);

            const content = document.createElement('div');
            content.className = 'details-content';

            appendResultBody(content, item);
            details.appendChild(content);

            card.appendChild(details);
        }
    });

    container.appendChild(card);
}

document.addEventListener('DOMContentLoaded', loadQuizData);
