const snipeItApiKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZDMyNjM5YTU1ODlkNmQ1NDYzNWYwZTNjOWQxNmM5YjU0ZDJkZjE1Mzk5NGQ3ZjkyYjFjYzEwMTlmZmZlZWJiYTQ5MjQ3YjEyNWQxZTdkYzkiLCJpYXQiOjE2ODIwMTQyNTcsIm5iZiI6MTY4MjAxNDI1NywiZXhwIjoyMTU1NDAzNDU3LCJzdWIiOiIxIiwic2NvcGVzIjpbXX0.TmyvTj7-zBOmjhAdhIzNCniAr5zd2XTQ49RNjTQ3HYF-UZZkRg7vuq_Qq_EkrKa9hyghmqTvxdHR4nPLVXL_TclOXBHPEDMVnanBD9dcCOBiUHvT-tV5Uk9EYa-0Y_U07ndbLD-G77wi479iB5Z3I0VXVZ1QtFXrWmta7xFFKcJIYmQTyAuBM78Z_JqZmbJ6bKFhV3X_19v_yTAZ-vDAqJltPjrF-3VnrM0xbF6xq4ybge6SY9CBQ-uCkCEjDuBmlNwy1405dJ4lAW1mdPLa9Qx_YVtwQ25m9Qib19Avi8Tt9v4tOG-_naS0YYblxPX6Ox1Q2TmBgtQPOEYzrLU1oNvKGLasKUxaIhuzV2_j2SfKzY5ASbGWG0ZnGy_xcnYYlYDySiH-6Cm0kuVb5oxxEbrX8pseL1GeM_jKhCxXop-KY-PtX8XYXXXuHS9TXF8di4KCqXY177LAmsXgOkOLiRKG3e5rTgKvdng8yGN1sgjRdqDJoq4y2AdoHpTipgJDvzE-LUKkXZLyAHda81ewz7DrjlXa495d9NktRHMcLzAx-T-vcdZA_OjqQp9fv2JxjiVAMNNr7f-cEVoFbZqzll96PxkKLXH-Enk7m4y8ZTV-zf6pJYKD0bLs-u4iK2EPmnHq_tNDAV-Nfa4pfKsQAFmtO8jZEmdORWolJ0-rLDU';
const snipeItApiBaseUrl = 'http://snipe.lan.d12bobcats.org/api/v1';

async function getDeviceInfo() {
    const serialNumber = await chrome.enterprise.deviceAttributes.getSerialNumber();
    const macAddress = await chrome.enterprise.deviceAttributes.getMacAddress();
    const deviceModel = await chrome.enterprise.deviceAttributes.getDeviceModel();

    return { serialNumber, macAddress, deviceModel };
}

async function getLastLoggedInUser() {
    return new Promise((resolve, reject) => {
        chrome.identity.getProfileUserInfo(({ email }) => {
            resolve(email);
        });
    });
}

async function fetchSnipeIt(path, options) {
    const response = await fetch(`${snipeItApiBaseUrl}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${snipeItApiKey}`,
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Snipe-IT API call failed with status ${response.status}`);
    }

    return response.json();
}

async function findDeviceInSnipeIt(serialNumber) {
    try {
        return await fetchSnipeIt(`/hardware/byserial/${serialNumber}`);
    } catch (error) {
        console.error(`Error fetching device by serial number: ${error}`);
        return null;
    }
}

async function updateDeviceInSnipeIt(deviceId, payload) {
    try {
        await fetchSnipeIt(`/hardware/${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error(`Error updating device in Snipe-IT: ${error}`);
    }
}

async function createDeviceInSnipeIt(payload) {
    try {
        await fetchSnipeIt('/hardware', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    } catch (error) {
        console.error(`Error creating device in Snipe-IT: ${error}`);
    }
}

async function syncDeviceWithSnipeIt() {
    const { serialNumber, macAddress, deviceModel } = await getDeviceInfo();
    const lastLoggedInUser = await getLastLoggedInUser();

    const existingDevice = await findDeviceInSnipeIt(serialNumber);

    const payload = {
        serial: serialNumber,
        mac_address: macAddress,
        model: deviceModel,
        last_logged_in_user: lastLoggedInUser,
    };

    if (existingDevice) {
        await updateDeviceInSnipeIt(existingDevice.id, payload);
    } else {
        await createDeviceInSnipeIt(payload);
    }
}

chrome.runtime.onStartup.addListener(() => {
    syncDeviceWithSnipeIt();
});
