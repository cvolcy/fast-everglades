module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    let currentDate = new Date();

    const data = {
        timestamp: currentDate.getTime(),
        date: currentDate.toDateString(),
        time: currentDate.toTimeString(),
        timezoneOffset: currentDate.getTimezoneOffset(),
        name: process.env.MY_NAME,
        email: process.env.MY_EMAIL,
    };

    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data, null, 3)
    };
};