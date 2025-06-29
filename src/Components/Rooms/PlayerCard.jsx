import playersPosition from "../../utils/playersPosition"
import './PlayerCard.css'

export default function PlayerCard({players, player, index}){
  return(
    <div 
      className="player-card"
      style={playersPosition[players.length][index] || {}}
      key={index} 
    >
        {
          player.isAdmin && 
          <div className="admin-tag" title="Administrador de la sala">A</div>
        }   
        <p>{player.username}</p>
        <p>{player.moneyInGame}</p>
    </div>
  )
}