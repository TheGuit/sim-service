function Logger(settings) {

    this.eventContainer = $(settings.container);
    this.maxLog = settings.maxLog;

    this.log = function (message) {
        this.eventContainer.append('<div><span style="display:inline-block;width: 80px">' + getHour() + "</span> " + message + '</div>');
        if (this.eventContainer.children().size() > this.maxLog) {
            this.eventContainer.children().first().remove();
        }
    }
}

function getHour() {
    var date = new Date();
    return date.getHours() + ":" + padLeft(date.getMinutes()) + ":" + padLeft(date.getSeconds());
}
function padLeft(number) {
    return ( number < 10 ? "0" : "" ) + number;
}

function BuildingTypeLoader(types, callback) {
    var imgCount = 0;
    for (var name in types) {
            function imageLoaded() {
                imgCount--;
                if (imgCount == 0) {
                    callback.call();
                }
            }
        var type = types[name];
        if (type instanceof BuildingType) {
            imgCount += type.status.length;

            type.status.forEach(function (status) {
                type.image[status] = new Image();
                type.image[status].src = "img/" + type.name + "-" + status + ".png";
                type.image[status].onload = imageLoaded;
            });
        }
    }
}

function BuildingType(name, width, height, status) {
    this.name = name;
    this.status = status;
    this.image = {};
    this.width = width;
    this.height = height;
}

function Point(x, y) {
    this.x = x;
    this.y = y;
}

function Team(name) {
    this.name = name;
    this.factories = [];
    this.color = null;
    this.getId = function () {
        return this.name.replace(" ", "");
    };

    this.totalPurchases = function () {
        var total = 0;
        for (key in this.factories) {
            total += this.factories[key].data.purchases;
        }
        return total;
    };

    this.totalCosts = function () {
        var total = 0;
        for (key in this.factories) {
            total += this.factories[key].data.costs;
        }
        return total;
    };

    this.totalSales = function () {
        var total = 0;
        for (key in this.factories) {
            total += this.factories[key].data.sales;
        }
        return total;
    };
}

function Factory(id) {
    this.id = id;
    this.score = 0;
}

function Building(data) {
    this.data = data;
    this.location = null;
    this.buildingType = null;
    this.hasCollision = function (x, y) {
        return x >= this.location.x && x <= this.location.x + type.width && y >= this.location.y && y <= this.location.y + this.buildingType.height
    }

}