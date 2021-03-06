/**
 * City
 * @param size
 * @constructor
 */
function City(size) {

    /* Event handlers */
    this.onReady = null;
    this.onUpdateLadder = null;
    this.onTeamCreated = null;
    this.onBuildingRemoved = null;

    this.init = function () {
        this.colors = ['red', 'green', 'blue', 'yellow', 'aquamarine', 'orange','black','pink','purple','grey','coral','DarkKhaki','magenta','lime','Cornsilk'];
        var that = this;
        this.context = null;
        this.tileUnit = 100;
        this.size = size;
        var delta = 0.1;

        this.buildableTypes = {
            farm: new BuildingType('farm', 2, 3,['up']),
            factory: new BuildingType('factory', 2, 2,['up','down']),
            store: new BuildingType('store', 1, 1,['up']),
            grass: new BuildingType('grass', 1, 1,['up']),
            bank: new BuildingType('bank', 3, 2,['up']),
            tree: new BuildingType('tree', 1, 1,['up'])
        };

        this.buildings = [];
        this.events = [];
        this.teams = [];
        this.matrix = this.createMatrix(this.size);

        // Preload resources
        new BuildingTypeLoader(this.buildableTypes, function () {
            that.drawGrass();
            that.onReady();
        });
    };

    this.createMatrix = function (size) {
        var matrix = new Array(size);
        for (var i = 0; i < size; i++) {
            matrix[i] = new Array(size);
        }
        return matrix;
    };

    this.fillMatrix = function (location, type, value) {
        for (var i = location.x; i < location.x + type.width; i++) {
            for (var j = location.y; j < location.y + type.height; j++) {
                this.matrix[i][j] = value;
            }
        }
    };

    /* Draw ground and grass tiles */
    this.drawGrass = function () {
        // Draw grass
        for (var i = 0; i < city.size; i++) {
            for (var j = 0; j < city.size; j++) {
                this.drawBuilding(new Point(i, j), this.buildableTypes.grass, null, null);
            }
        }

        var p0 = this.translate(0, this.size);
        var p1 = this.translate(this.size, this.size);
        var p2 = this.translate(this.size, 0);

        // side 1
        this.context.beginPath();
        this.context.fillStyle = "#492D00";
        this.context.moveTo(p0.x, p0.y);
        this.context.lineTo(p1.x, p1.y);
        this.context.lineTo(p1.x, p1.y + this.tileUnit / 2);
        this.context.lineTo(p0.x, p0.y + this.tileUnit / 2);
        this.context.lineTo(p0.x, p0.y);
        this.context.fill();
        this.context.closePath();

        //side 2
        this.context.beginPath();
        this.context.fillStyle = "#1E1200";
        this.context.moveTo(p2.x, p2.y);
        this.context.lineTo(p1.x, p1.y);
        this.context.lineTo(p1.x, p1.y + this.tileUnit / 2);
        this.context.lineTo(p2.x, p2.y + this.tileUnit / 2);
        this.context.lineTo(p2.x, p2.y);
        this.context.fill();
        this.context.closePath();

    };

    /**
     * Check buildings collision
     * @param buildingType
     * @param x
     * @param y
     * @returns {boolean}
     */
    this.hasCollision = function (buildingType, x, y) {
        for (var w = 0; w < buildingType.width; w++) {
            for (var h = 0; h < buildingType.height; h++) {
                if (w + x >= this.size || h + y >= this.size) {
                    return true;
                }

                if (this.matrix[w + x][h + y] != null) {
                    return true;
                }
            }
        }
        return false;
    };

    /**
     * Return the number of teams
     * @returns {number}
     */
    this.getTeamsCount = function () {
        var count = 0;
        for (x in this.teams) {
            count++;
        }
        return count;
    };

    /**
     * Init city buildings from inventory
     * @param services
     */
    this.initModel = function (services) {
        for (var typeKey in services) {
            var type = services[typeKey];
            for (var serviceKey in type) {
                var service = type[serviceKey];
                this.addBuilding(service);
            }
        }
    };

    /**
     * Update city from inventory
     * @param services
     */
    this.updateModel = function (services) {
        that = this;
        // Add unknown
        var serviceTypeKey, serviceType, serviceKey, service;
        for (serviceTypeKey in services) {
            serviceType = services[serviceTypeKey];
            for (serviceKey in serviceType) {
                service = serviceType[serviceKey];
                var building = that.getBuildingById(serviceKey);
                if (!building) {
                    that.addBuilding(service);
                    building = that.getBuildingById(serviceKey);
                }
                building.status = service.alive ? 'up' : 'down';
            }
        }
        this.redrawBuildings();
        this.onUpdateLadder(this.getTeamsReport());
    };

    /**
     * Add building to the city
     * @param data
     */
    this.addBuilding = function (data) {
        var type = this.buildableTypes[data.type];
        if (type) {
            var building = new Building(data);
            building.location = this.findRandomLocation(type);
            building.buildingType = type;
            building.status = data.alive ? 'up' : 'down';
            if (data.id) {
                this.buildings[data.id] = building;
            }
            this.fillMatrix(building.location, type, true);
            if (type.name == 'factory') {
                var team = this.teams[data.team];
                if (!team) {
                    team = new Team(data.team);
                    team.color = this.colors[this.getTeamsCount()];
                    this.teams[data.team] = team;
                    this.onTeamCreated(team);
                }
                team.factories[data.id] = building;
                building.team = team;
                this.drawBuilding(building.location, type, team.color, building.status);
                this.onUpdateLadder(this.getTeamsReport());
            } else {
                this.drawBuilding(building.location, type, null, building.status);
            }
        }
    };

    /**
     * Remove building from city
     * @param index
     */
    this.removeBuilding = function (index) {
        var old = this.buildings[index];
        this.fillMatrix(old.location, old.buildingType, false);
        this.redrawBuildings();
        delete this.buildings[index];
        if (this.onBuildingRemoved) {
            this.onBuildingRemoved(old);
        }
    };

    /**
     *
     * @param buildingType
     * @returns {*}
     */
    this.findRandomLocation = function (buildingType) {
        var x, y, maxTry = 10;
        while (maxTry > 0) {
            maxTry--;
            x = Math.floor(Math.random() * this.size);
            y = Math.floor(Math.random() * this.size);
            if (!this.hasCollision(buildingType, x, y)) {
                return new Point(x, y);
            }
        }
        return null;
    };

    /**
     *
     * @param location
     * @param building
     * @param background
     */
    this.drawBuilding = function (location, building, background, status) {
        var p0 = this.translate(location.x, location.y);
        var p1 = this.translate(location.x + building.width, location.y);
        var p2 = this.translate(location.x + building.width, location.y + building.height);
        var p3 = this.translate(location.x, location.y + building.height);
        if (background) {
            this.context.beginPath();
            this.context.fillStyle = background;
            this.context.moveTo(p0.x, p0.y);
            this.context.lineTo(p1.x, p1.y);
            this.context.lineTo(p2.x, p2.y);
            this.context.lineTo(p3.x, p3.y);
            this.context.lineTo(p0.x, p0.y);
            this.context.fill();
            this.context.closePath();
        }
        var image = building.image[status] ? building.image[status] : building.image['up'];
        var scaleRatio = (p1.x - p3.x) / image.width;
        var scaledWidth = image.width * scaleRatio;
        var scaledHeight = image.height * scaleRatio;
        this.context.drawImage(image, p0.x - (p0.x - p3.x), p0.y - scaledHeight - (p0.y - p2.y), scaledWidth, scaledHeight);
    };


    /**
     * Translate coordinates
     * @param oriX
     * @param oriY
     * @returns {Point}
     */
    this.translate = function (oriX, oriY) {
        var angle = Math.PI / 4;
        var cityWidth = (this.size * this.tileUnit) / Math.cos(angle);
        var offset = cityWidth / 2;
        var x = offset + (Math.cos(angle) * (oriX * this.tileUnit) - Math.sin(angle) * (oriY * this.tileUnit));
        var y = (Math.sin(angle) * (oriX * this.tileUnit) + Math.cos(angle) * (oriY * this.tileUnit)) / 2;
        return new Point(x, y);
    };

    /**
     * Redraw city canvas
     */
    this.redraw = function () {
        var event;
        for (var i in this.events) {
            event = this.events[i];
            var fontHeight = this.tileUnit * 0.5;
            this.animationContext.font = fontHeight + "px Verdana";
            var dim = this.animationContext.measureText(event.message);
            this.animationContext.clearRect(event.location.x, event.location.y - fontHeight + 5, dim.width, fontHeight);
            var alpha = event.alpha;
            if (alpha > 1) {
                alpha = 1;
            }

            if (alpha <= 0) {
                this.events.shift();
            } else {
                this.animationContext.globalAlpha = alpha;
                this.animationContext.fillStyle = event.color ? event.color : "black";
                this.animationContext.fillText(event.message, event.location.x, event.location.y);
            }
            event.alpha -= delta;
        }
    };

    this.redrawBuildings = function () {
        this.drawGrass();
        var that = this;
        var buildings = [];
        for(var key in this.buildings){
            buildings.push(this.buildings[key]);
        }
        buildings.sort(function (a, b) {
            return  (a.location.x +  that.size * a.location.y) - (b.location.x + that.size * b.location.y);
        });

        for(key in buildings){
            var building = buildings[key];
            that.drawBuilding(building.location, building.buildingType, building.team ? building.team.color : false, building.status);
        }
    };

    this.getFactoryById = function (factoryId) {
        for (var t in this.teams) {
            var team = this.teams[t];
            for (var f in team.factories) {
                var factory = team.factories[f];
                if (factory.id == factoryId) {
                    return factory;
                }
            }
        }
        return null;
    };

    this.getBuildingById = function (serviceId) {
        return this.buildings[serviceId];
    };

    this.getTeamsReport = function () {
        return this.teams;
    };

    this.addDecoration = function(name,count){
        if(!count){
            count = 1;
        }
        var decoration = {type: name, alive: true};
        for (var i = 0; i < count; i++) {
            decoration.id = 'name-' + UUID();
            city.addBuilding(decoration);
        }
    };

    /*     Init     */
    this.init();
}