/**
 * Created by massimo on 2014/5/6.
 */
var client = new Dropbox.Client({
    key: "2l9256omgxuptj7",
    secret: "st1c637uqtgxt4l"
});

client.authDriver(new Dropbox.AuthDriver.Popup({
    receiverUrl: 'dropbox/chrome_oauth_receiver.html'
}));