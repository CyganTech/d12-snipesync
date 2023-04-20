async function updateDeviceInfo() {
    const serialNumberElem = document.getElementById("serialNumber");
    const macAddressElem = document.getElementById("macAddress");
    const deviceModelElem = document.getElementById("deviceModel");
    const lastLoggedInUserElem = document.getElementById("lastLoggedInUser");

    const { serialNumber, macAddress, deviceModel } = await getDeviceInfo();
    const lastLoggedInUser = await getLastLoggedInUser();

    serialNumberElem.textContent = serialNumber;
    macAddressElem.textContent = macAddress;
    deviceModelElem.textContent = deviceModel;
    lastLoggedInUserElem.textContent = lastLoggedInUser;
}

document.getElementById("syncButton").addEventListener("click", () => {
    syncDeviceWithSnipeIt();
    updateDeviceInfo();
});

updateDeviceInfo();
