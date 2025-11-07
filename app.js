// Global state
let designPreferences = {};
let uploadedImages = [];

// DOM Elements
const questionnaireSection = document.getElementById('questionnaire-section');
const uploadSection = document.getElementById('upload-section');
const resultsSection = document.getElementById('results-section');
const questionnaireForm = document.getElementById('questionnaire-form');
const imageInput = document.getElementById('image-input');
const uploadArea = document.getElementById('upload-area');
const imagePreview = document.getElementById('image-preview');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const resultsContainer = document.getElementById('results-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    // Questionnaire form submission
    questionnaireForm.addEventListener('submit', handleQuestionnaireSubmit);

    // Image upload
    imageInput.addEventListener('change', handleImageSelect);
    uploadArea.addEventListener('click', () => imageInput.click());

    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);

    // Generate button
    generateBtn.addEventListener('click', handleGenerate);
}

function handleQuestionnaireSubmit(e) {
    e.preventDefault();

    // Collect form data
    const formData = new FormData(questionnaireForm);
    designPreferences = {};

    for (let [key, value] of formData.entries()) {
        designPreferences[key] = value;
    }

    console.log('Design Preferences:', designPreferences);

    // Show upload section
    showSection('upload');
}

function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    processFiles(files);
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');

    const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
    );

    processFiles(files);
}

function processFiles(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const imageData = {
                    file: file,
                    dataUrl: e.target.result,
                    name: file.name
                };

                uploadedImages.push(imageData);
                renderImagePreview();
                updateGenerateButton();
            };

            reader.readAsDataURL(file);
        }
    });
}

function renderImagePreview() {
    imagePreview.innerHTML = '';

    uploadedImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';

        previewItem.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <button class="remove-btn" onclick="removeImage(${index})">×</button>
        `;

        imagePreview.appendChild(previewItem);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    renderImagePreview();
    updateGenerateButton();
}

function updateGenerateButton() {
    generateBtn.disabled = uploadedImages.length === 0;
}

async function handleGenerate() {
    if (uploadedImages.length === 0) {
        alert('Please upload at least one image');
        return;
    }

    showSection('results');
    loading.style.display = 'block';
    resultsContainer.classList.remove('visible');

    try {
        // Prepare data for API
        const requestData = {
            preferences: designPreferences,
            images: uploadedImages.map(img => ({
                name: img.name,
                data: img.dataUrl
            }))
        };

        // Call backend API
        const response = await fetch('/api/generate-staging', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();

        // Display results
        displayResults(results);

    } catch (error) {
        console.error('Error generating staging:', error);
        loading.innerHTML = `
            <div class="alert alert-error">
                <strong>Error:</strong> ${error.message}<br>
                <small>Please make sure the backend server is running on port 3000</small>
            </div>
            <button class="btn-secondary" onclick="goBack()">Go Back</button>
        `;
    }
}

function displayResults(results) {
    loading.style.display = 'none';
    resultsContainer.classList.add('visible');
    resultsContainer.innerHTML = '';

    results.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';

        resultItem.innerHTML = `
            <img src="${result.imageUrl || uploadedImages[index].dataUrl}" alt="Staged ${uploadedImages[index].name}">
            <div class="result-content">
                <h3>${result.roomType || 'Room ' + (index + 1)}</h3>
                <p><strong>Design Description:</strong></p>
                <p>${result.description}</p>
                <p><strong>Furniture & Decor:</strong></p>
                <p>${result.suggestions}</p>
                <button class="download-btn" onclick="downloadImage(${index})">
                    Download Design
                </button>
            </div>
        `;

        resultsContainer.appendChild(resultItem);
    });
}

function downloadImage(index) {
    const link = document.createElement('a');
    link.href = uploadedImages[index].dataUrl;
    link.download = `staged-${uploadedImages[index].name}`;
    link.click();
}

function showSection(section) {
    questionnaireSection.classList.remove('active');
    uploadSection.classList.remove('active');
    resultsSection.classList.remove('active');

    if (section === 'questionnaire') {
        questionnaireSection.classList.add('active');
    } else if (section === 'upload') {
        uploadSection.classList.add('active');
    } else if (section === 'results') {
        resultsSection.classList.add('active');
    }
}

function goBack() {
    if (resultsSection.classList.contains('active')) {
        showSection('upload');
    } else if (uploadSection.classList.contains('active')) {
        showSection('questionnaire');
    }
}

function startOver() {
    // Reset state
    designPreferences = {};
    uploadedImages = [];

    // Reset form
    questionnaireForm.reset();
    imagePreview.innerHTML = '';
    resultsContainer.innerHTML = '';

    // Show first section
    showSection('questionnaire');
}

// Download all functionality
document.getElementById('download-all-btn')?.addEventListener('click', () => {
    uploadedImages.forEach((image, index) => {
        setTimeout(() => {
            downloadImage(index);
        }, index * 500); // Stagger downloads
    });
});
