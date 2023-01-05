import QrScanner from './qr-scanner.min.js';

/* 
    ==========================================
    1. Selectors
    2. Init libraries
    3. Event Listeners
    4. Functions
    ==========================================
*/

// ******** 1. Selectors ******** //
const modal = document.querySelector('ion-modal'),
    loader = document.getElementById('loader'),
    backdrop = document.getElementById('backdrop'),
    video = document.getElementById('qr-video'),
    camList = document.getElementById('cam-list'),
    facilityName = document.querySelectorAll('.facility_name'),
    billValue = document.querySelectorAll('.bill_value'),
    billDate = document.querySelectorAll('.bill_date'),
    tabScan = document.getElementById('tab_scan'),
    scanAgain = document.getElementById('scan_again');

let scanner;

// ******** 2. Init libraries ******** //
// FilePond library init to upload files.
FilePond.registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);
FilePond.create(document.getElementById('uploader_input'), {
    labelIdle: `الرجاء إختيار صورة كود الفاتورة من أجل التحقق <span class="filepond--label-action">إختر</span>`,
    imagePreviewHeight: 170,
    imageCropAspectRatio: '1:1',
    imageResizeTargetWidth: 200,
    imageResizeTargetHeight: 200,
    stylePanelLayout: 'compact circle',
    styleLoadIndicatorPosition: 'center bottom',
    styleButtonRemoveItemPosition: 'center bottom',
    acceptedFileTypes: ['image/png', 'image/jpeg'],
});

// ******** 3. Event listeners ******** //
// Upload QR image
document.addEventListener('FilePond:addfile', (e) => {
    const file = e.detail.file.file;
    if (!file) return;
    QrScanner.scanImage(file, { returnDetailedScanResult: true })
        .then((result) => {
            let validQr = qrValidation(result.data);
            if (qrChecker(validQr)) {
                let dataObj = {
                    code: validQr,
                    codeType: 1,
                };
                postData('http://185.216.133.12/Taxapi/api/Bill/CheckBill', dataObj).then((data) => {
                    if (data.succeed) {
                        // let test = '2022-11-17 12:57';
                        // let testDate = new Date(test);
                        // console.log(testDate.toUTCString());
                        facilityName[0].textContent = data.data.facilityName;
                        billValue[0].textContent = data.data.billValue + ' ل.س';
                        billDate[0].textContent = data.data.billDate;
                        modal.isOpen = true;
                        modal.breakpoints = [0, 0.25, 0.5, 0.75];
                    } else {
                        presentAlert('فاتورة غير مرحلة', 'الفاتورة قيد الترحيل، يرجى إعادة التحقق خلال ثلاثة أيام', ['حسناً']);
                    }
                    loader.style.visibility = 'hidden';
                    backdrop.style.visibility = 'hidden';
                });
            } else {
                presentAlert('خطأ', 'هذا الرمز لا يتبع للهيئة العامة للضرائب والرسوم', ['حسناً']);
                loader.style.visibility = 'hidden';
                backdrop.style.visibility = 'hidden';
            }
        })
        .catch((error) => {
            presentAlert('خطأ', 'لم يتم تحديد رمز QR في الصورة', ['حسناً']);
            loader.style.visibility = 'hidden';
            backdrop.style.visibility = 'hidden';
        });
});

// Camera QR scanning
tabScan.addEventListener('click', function () {
    scanner = new QrScanner(
        video,
        (result) => {
            let validQr = qrValidation(result.data);
            scanner.stop();
            scanAgain.disabled = false;
            if (qrChecker(validQr)) {
                let dataObj = {
                    code: validQr,
                    codeType: 1,
                };
                postData('http://185.216.133.12/Taxapi/api/Bill/CheckBill', dataObj).then((data) => {
                    if (data.succeed) {
                        facilityName[0].innerHTML = data.data.facilityName;
                        billValue[0].innerHTML = data.data.billValue + ' ل.س';
                        billDate[0].innerHTML = data.data.billDate;
                        modal.isOpen = true;
                        modal.breakpoints = [0, 0.25, 0.5, 0.75];
                    } else {
                        presentAlert('فاتورة غير مرحلة', 'الفاتورة قيد الترحيل، يرجى إعادة التحقق خلال ثلاثة أيام', ['حسناً']);
                    }
                    loader.style.visibility = 'hidden';
                    backdrop.style.visibility = 'hidden';
                });
            } else {
                presentAlert('خطأ', 'هذا الرمز لا يتبع للهيئة العامة للضرائب والرسوم', ['حسناً']);
                loader.style.visibility = 'hidden';
                backdrop.style.visibility = 'hidden';
            }
        },
        {
            onDecodeError: (error) => {
                // presentAlert('خطأ', 'لم يتم تحديد رمز QR في الصورة', ['حسناً']);
                // loader.style.visibility = 'hidden';
                // backdrop.style.visibility = 'hidden';
            },
            highlightScanRegion: true,
            highlightCodeOutline: true,
        }
    );
    scanner.start().then(() => {
        QrScanner.listCameras(true).then((cameras) =>
            cameras.forEach((camera) => {
                const option = document.createElement('ion-select-option');
                option.value = camera.id;
                option.textContent = camera.label;
                camList.appendChild(option);
            })
        );
    });
});

scanAgain.addEventListener('click', function () {
    scanner.start();
});

// Show loader when file start upload
document.addEventListener('FilePond:addfilestart', () => {
    loader.style.visibility = 'visible';
});

// Show backdrop when file init
document.addEventListener('FilePond:initfile', () => {
    backdrop.style.visibility = 'visible';
});

// Close modal when Dismiss
modal.addEventListener('didDismiss', () => {
    modal.isOpen = false;
});

// ******** 4. Functions ******** //
// Request from API
async function postData(url = 'http://185.216.133.12/Taxapi/api/Bill/CheckBill', data = {}) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(data),
    });
    return response.json();
}

// Call alert
async function presentAlert(header = 'Alert', message = '', button = ['Ok']) {
    const alert = document.createElement('ion-alert');
    alert.header = header;
    alert.message = message;
    alert.buttons = button;
    document.body.appendChild(alert);
    await alert.present();
}

// Check regex
function qrValidation(qrCode) {
    //^(?:@|#\w+#\w+|)#[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}@\w+@|#|$
    let regexTypeOne = new RegExp(/^@[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}@\w+|\W@$/i);
    let regexTypeTwo = new RegExp(/^#\w+#\W|\w+#[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}#$/i);
    let regexTypeThree = new RegExp(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    if (regexTypeOne.test(qrCode)) {
        return qrCode.slice(1, 37);
    } else if (regexTypeTwo.test(qrCode)) {
        return qrCode.split('#')[3];
    } else if (regexTypeThree.test(qrCode)) {
        return qrCode;
    } else {
        return false;
    }
}

function qrChecker(qrCode) {
    if (qrCode) return true;
    else return false;
}
