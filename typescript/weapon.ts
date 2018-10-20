type WeaponConfig = {
    /**
     * Nombre que identifica esta arma
     */
    name :string,
    /**
     * Dirección donde se almacena el spritesheet de esta arma (partiendo de assets/sprites)
     */
    path :string,
    /**
     * Ancho de los fotogramas de la animación
     */
    frameWidth :integer,
    /**
     * Alto de los fotogramas de la animación
     */
    frameHeight :integer,
    /**
     * Velocidad de la animación
     */
    frameRate :integer
    /**
     * Animaciones de movimiento del arma, que acompañan al jugador
     */
    animations? :{
        /**
         * Animación cuando el jugador camina hacia arrba
         */
        up :integer[],
        /**
         * Animación cuando el jugador camina hacia abajo
         */
        down :integer[],
        /**
         * Animación cuando el jugador camina hacia la derecha (también se usa para la izquierda)
         */
        side :integer[]
    },
    /**
     * Desfase de la posición del arma respecto a la posición del jugador. Cada dirección es un vector
     * {x, y} de arrays. Cada elemento de los arrays se corresponde con las coordenadas en cada fotograma
     * de la animación correspondiente del jugador.
     */
    offset? :{
        /**
         * Desfase cuando el jugador mira hacia arriba
         */
        up :{
            x :integer[],
            y :integer[]
        },
        /**
         * Desfase cuando el jugador mira hacia abajo
         */
        down :{
            x :integer[],
            y :integer[]
        },
        /**
         * Desfase cuando el jugador mira hacia la derecha
         */
        side :{
            x :integer[],
            y :integer[]
        }
    }
}

class Weapon {
    /**
     * Nombre que identifica a esta arma
     */
    private name :string;
    /**
     * Sprite que representa al arma en el sistema de físicas de Phaser
     */
    public sprite :Phaser.Physics.Arcade.Sprite;
    /**
     * Objeto de configuración con el que se inicializó el arma
     */
    private config :WeaponConfig;
    /**
     * Escena a la que pertenece el arma
     */
    private scene :Phaser.Scene;
    /** 
    * Jugador que porta el arma
    */
    private player :Player;

    /**
     * Crea un arma con las opciones pasadas como parámetro
     * @param player Jugador que porta el arma
     * @param config Objeto que contiene las opciones mencionadas
     */
    constructor(player :Player, config :WeaponConfig) {
        this.name = config.name;
        this.config = config;
        this.scene = player.scene;
        this.player = player;
    }

    /**
     * Carga los recursos necesarios para el arma
     */
    preload() {
        // Cargamos el spritesheet indicado
        this.scene.load.spritesheet(this.name, "assets/sprites/"+this.config.path, {
            frameWidth: this.config.frameWidth, frameHeight: this.config.frameHeight});
    }

    /**
     * Inicializa los recursos preparados con preload()
     */
    create() {
        // Introducimos el sprite en el sistema de físicas de Phaser. La posición
        // es irrelevante porque se modificará en update().
        this.sprite = this.scene.physics.add.sprite(0, 0, this.name, 0);

        // Nos aseguramos de que todos los parámetros opcionales tienen valor
        // aunque no hayan sido especificados desde fuera
        this.setDefaultValues();
    }

    /**
     * Actualizamos el arma en cada fotograma
     */
    update() {
        // Vamos a calcular el desfase que hay entre la posición del arma y el jugador que la porta
        // en este fotograma, teniendo en cuenta su dirección y su animación. Empezamos partiendo
        // de que no hay desfase (y, por tanto, el arma está en el mismo punto que el jugador).
        var offset = {
            x: 0,
            y: 0
        }
        // Comprobamos en qué dirección está mirando el jugador
        switch(this.player.getDirection()) {
            // Si está mirando en cierta dirección:
                // Indicamos si el sprite del arma debe estar volteado;
                // Le asignamos el desfase que indique la configuración.
                // El desfase es una serie de arrays de coordenadas, donde cada coordenada
                // corresponde a un fotograma de la animación del jugador.
            
            case "left":
                this.sprite.flipX = true;
                // Aquí la animación estará volteada horizontalmente, por lo que también debemos
                // invertir el desfase en el eje X para que cuadre
                offset = {
                    x: -this.config.offset.side.x[this.player.getAnimationFrame()],
                    y: this.config.offset.side.y[this.player.getAnimationFrame()]
                }
                break;

            case "right":
                this.sprite.flipX = false;
                offset = {
                    x: this.config.offset.side.x[this.player.getAnimationFrame()],
                    y: this.config.offset.side.y[this.player.getAnimationFrame()]
                }
                break;

            case "up":
                this.sprite.flipX = false;
                offset = {
                    x: this.config.offset.up.x[this.player.getAnimationFrame()],
                    y: this.config.offset.up.y[this.player.getAnimationFrame()]
                }
                break;

            case "down":
                this.sprite.flipX = false;
                offset = {
                    x: this.config.offset.down.x[this.player.getAnimationFrame()],
                    y: this.config.offset.down.y[this.player.getAnimationFrame()]
                }
                break;
        }

        // Ahora nos encargamos de poner la profundidad adecuada para el arma, que será
        // junto a la del jugador. Si está mirando a la izquierda...
        if(this.sprite.flipX) {
            // ... el arma la lleva por detrás
            this.sprite.depth = this.player.sprite.depth - 1;
        } else {
            // Si no, el arma se ve delante del personaje
            this.sprite.depth = this.player.sprite.depth + 1;
        }

        // Por último, colocamos el arma junto al jugador atendiendo al desfase calcuado previamente
        this.sprite.setPosition(this.player.getPosition().x + offset.x,
                                this.player.getPosition().y + offset.y);
    }

    /**
     * Asigna valores predeterminados a los parámetros opcionales de la configuración
     */
    private setDefaultValues() {
        // Si no hay información de animación, entonces todas las animaciones muestran
        // únicamente el primer fotograma
        if(!this.config.animations) {
            this.config.animations = {
                up: [0],
                down: [0],
                side: [0]
            }
        }
        // Si no hay información del desplazamiento, entonces no podemos hacer más que
        // asumir que no hay
        if(!this.config.offset) {
            this.config.offset = {
                up: {
                    x: [0],
                    y: [0]
                },
                down: {
                    x: [0],
                    y: [0]
                },
                side: {
                    x: [0],
                    y: [0]
                }
            }
        }
    }
}